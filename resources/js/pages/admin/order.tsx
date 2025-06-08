import { Button } from '@/components/button';
import { ModalDialog } from '@/components/modal-dialog';
import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { Loader2, SquarePen, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

interface OrderItem {
    id: number;
    product_id: number;
    product: {
        name: string;
        price: number;
    };
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    customer_id: number;
    total_price: number;
    status: string;
    created_at: string;
    customer: {
        name: string;
    };
    items: OrderItem[];
}

interface Props {
    orders: {
        data: Order[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        status?: string;
        min_price?: string;
        max_price?: string;
    };
    role: string;
    id: number;
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders Management',
        href: '/admin/orders',
    },
];

export default function Index({ orders: initialOrders, filters: initialFilters, flash }: Props) {
    const [modalState, setModalState] = useState({
        edit: false,
        delete: false,
    });
    const [allOrders] = useState<Order[]>(initialOrders.data);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders.data);
    const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
    const [filters, setFilters] = useState({
        status: initialFilters.status || '',
        minPrice: initialFilters.min_price || '',
        maxPrice: initialFilters.max_price || '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const totalPages = useMemo(() => Math.ceil(filteredOrders.length / itemsPerPage), [filteredOrders]);
    const hasActiveFilters = useMemo(
        () => searchTerm.trim() !== '' || filters.status !== '' || filters.minPrice !== '' || filters.maxPrice !== '',
        [searchTerm, filters],
    );

    useEffect(() => {
        let results = [...allOrders];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            results = results.filter((order) => order.customer.name.toLowerCase().includes(term));
        }

        // Apply status filter
        if (filters.status) {
            results = results.filter((order) => order.status === filters.status);
        }

        // Apply price filters
        if (filters.minPrice) {
            results = results.filter((order) => order.total_price >= Number(filters.minPrice));
        }
        if (filters.maxPrice) {
            results = results.filter((order) => order.total_price <= Number(filters.maxPrice));
        }

        setFilteredOrders(results);
        setCurrentPage(1);
    }, [allOrders, searchTerm, filters]);

    // Paginate results
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        setDisplayedOrders(filteredOrders.slice(startIndex, startIndex + itemsPerPage));
    }, [filteredOrders, currentPage]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({
            status: '',
            minPrice: '',
            maxPrice: '',
        });
    }, []);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Format price display
    const formatPriceDisplay = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const openModal = (type: 'edit' | 'delete', order?: Order) => {
        if (type === 'edit' && order) {
            setSelectedOrder(order);
        } else if (type === 'delete' && order) {
            setSelectedOrderId(order.id);
        }

        setModalState((prev) => ({ ...prev, [type]: true }));
    };

    const closeModal = useCallback((type: 'edit' | 'delete') => {
        setModalState((prev) => ({ ...prev, [type]: false }));
        if (type === 'edit') setSelectedOrder(null);
        if (type === 'delete') setSelectedOrderId(null);
    }, []);

    const handleUpdateSubmit = (status: string) => {
        if (!selectedOrder) return;
        setIsSubmitting(true);

        Inertia.put(
            route('admin.orders.update', selectedOrder.id),
            { status },
            {
                onSuccess: () => {
                    closeModal('edit');
                    toast.success('Order status updated successfully');
                },
                onError: (errors) => {
                    console.error('Error:', errors);
                    toast.error('Failed to update order status');
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleDeleteConfirm = () => {
        if (!selectedOrderId) return;
        setIsSubmitting(true);

        Inertia.delete(route('admin.orders.destroy', selectedOrderId), {
            onSuccess: () => {
                closeModal('delete');
                toast.success('Order deleted successfully');
            },
            onError: () => toast.error('Failed to delete order'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (modalState.edit) closeModal('edit');
                if (modalState.delete) closeModal('delete');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modalState, closeModal]);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, {
                position: 'top-right',
                autoClose: 5000,
            });
        }
        if (flash?.error) {
            toast.error(flash.error, {
                position: 'top-right',
                autoClose: 5000,
            });
        }
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders Management" />
            <ToastContainer position="top-right" autoClose={5000} />

            <div className="flex flex-col gap-4 p-4">
                <div className="rounded-xl border bg-white p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">List Orders</h2>
                            <p className="text-sm text-gray-500">Manage customer orders</p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-3 space-y-2">
                        {/* Search Input */}
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-white p-2 py-2 pr-3 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Filter Row */}
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                            {/* Status Filter */}
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Price Range */}
                            <input
                                type="number"
                                placeholder="Min Price"
                                value={filters.minPrice}
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Max Price"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            />

                            {/* Clear Button */}
                            <Button
                                onClick={clearAllFilters}
                                variant={hasActiveFilters ? 'danger' : 'secondary'}
                                disabled={!hasActiveFilters}
                                className="flex items-center justify-center"
                            >
                                {hasActiveFilters && <Trash2 className="mr-2 h-4 w-4" />}
                                Clear Filters
                            </Button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">#{order.id}</td>
                                        <td className="px-4 py-3">{order.customer.name}</td>
                                        <td className="px-4 py-3">
                                            <div className="max-h-20 overflow-y-auto">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="text-sm">
                                                        {item.product.name} (x{item.quantity})
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{formatPriceDisplay(order.total_price)}</td>
                                        <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                    order.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : order.status === 'processing'
                                                          ? 'bg-blue-100 text-blue-800'
                                                          : order.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal('edit', order)}
                                                    className="rounded bg-yellow-500 p-1 text-white hover:bg-yellow-600"
                                                >
                                                    <SquarePen size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openModal('delete', order)}
                                                    className="rounded bg-red-500 p-1 text-white hover:bg-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                </div>
            </div>

            {/* Edit Order Modal */}
            <ModalDialog isOpen={modalState.edit} onClose={() => closeModal('edit')} title={`Update Order Status`} size="sm">
                {selectedOrder && (
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">
                                Current Status:
                                <span
                                    className={`ml-2 ${
                                        selectedOrder.status === 'completed'
                                            ? 'text-green-600'
                                            : selectedOrder.status === 'processing'
                                              ? 'text-blue-600'
                                              : selectedOrder.status === 'pending'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                    }`}
                                >
                                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                </span>
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={selectedOrder.status === 'pending' ? 'primary' : 'secondary'}
                                    onClick={() => handleUpdateSubmit('pending')}
                                    disabled={isSubmitting || selectedOrder.status === 'pending'}
                                >
                                    Pending
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedOrder.status === 'pending' ? 'primary' : 'secondary'}
                                    onClick={() => handleUpdateSubmit('processing')}
                                    disabled={isSubmitting || selectedOrder.status === 'processing'}
                                >
                                    Processing
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedOrder.status === 'pending' ? 'primary' : 'secondary'}
                                    onClick={() => handleUpdateSubmit('completed')}
                                    disabled={isSubmitting || selectedOrder.status === 'completed'}
                                >
                                    Completed
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedOrder.status === 'pending' ? 'primary' : 'secondary'}
                                    onClick={() => handleUpdateSubmit('cancelled')}
                                    disabled={isSubmitting || selectedOrder.status === 'cancelled'}
                                >
                                    Cancelled
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="secondary" onClick={() => closeModal('edit')} disabled={isSubmitting}>
                                Close
                            </Button>
                        </div>
                    </form>
                )}
            </ModalDialog>

            {/* Delete Confirmation Modal */}
            <ModalDialog isOpen={modalState.delete} onClose={() => closeModal('delete')} title="Confirm Deletion" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this order? This action cannot be undone.</p>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => closeModal('delete')} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="button" variant="danger" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Order'
                            )}
                        </Button>
                    </div>
                </div>
            </ModalDialog>
        </AppLayout>
    );
}
