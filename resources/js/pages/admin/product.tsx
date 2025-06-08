import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { ModalDialog } from '@/components/modal-dialog';
import { MultiFileInput } from '@/components/multi-file-input';
import { Textarea } from '@/components/textarea';
import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { CirclePlus, Image as ImageIcon, Loader2, SquarePen, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

interface Category {
    id: number;
    name: string;
    active: 'true' | 'false';
}

interface ProductImage {
    id: number;
    image_product_url: string;
}

interface Product {
    id: number;
    seller_id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image_url: string | null;
    category_id: number;
    category: Category;
    is_moderated: 'true' | 'false';
    images: ProductImage[];
    seller?: {
        name: string;
    };
}

interface Props {
    id: number;
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products Management',
        href: '/admin/products',
    },
];

export default function Index({ products: initialProducts, categories, flash, id }: Props) {
    const [modalState, setModalState] = useState({
        create: false,
        edit: false,
        delete: false,
    });
    // State management
    const [allProducts] = useState<Product[]>(initialProducts.data);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts.data);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [oldImageUrls, setOldImageUrls] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        minPrice: '',
        maxPrice: '',
    });
    const [formData, setFormData] = useState({
        seller_id: id,
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category_id: 0,
        is_moderated: 'false',
        images: [] as File[],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const totalPages = useMemo(() => Math.ceil(filteredProducts.length / itemsPerPage), [filteredProducts]);
    const hasActiveFilters = useMemo(
        () => searchTerm.trim() !== '' || filters.category !== '' || filters.status !== '' || filters.minPrice !== '' || filters.maxPrice !== '',
        [searchTerm, filters],
    );

    const resetForm = useCallback(() => {
        setFormData({
            seller_id: id,
            name: '',
            description: '',
            price: 0,
            stock: 0,
            category_id: 0,
            is_moderated: 'false',
            images: [],
        });
        setPreviewImages([]);
        setOldImageUrls([]);
    }, [id]);

    useEffect(() => {
        let results = [...allProducts];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            results = results.filter((p) => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
        }

        // Apply category filter
        if (filters.category) {
            results = results.filter((p) => p.category_id === Number(filters.category));
        }

        // Apply status filter
        if (filters.status === 'true') {
            results = results.filter((p) => p.is_moderated === 'true');
        } else if (filters.status === 'false') {
            results = results.filter((p) => p.is_moderated === 'false');
        }

        // Apply price filters
        if (filters.minPrice) {
            results = results.filter((p) => p.price >= Number(filters.minPrice));
        }
        if (filters.maxPrice) {
            results = results.filter((p) => p.price <= Number(filters.maxPrice));
        }

        setFilteredProducts(results);
        setCurrentPage(1);
    }, [allProducts, searchTerm, filters]);

    // Paginate results
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        setDisplayedProducts(filteredProducts.slice(startIndex, startIndex + itemsPerPage));
    }, [filteredProducts, currentPage]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({
            category: '',
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
        }));
    };

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));

            // Create preview URLs
            const newPreviews: string[] = [];
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === files.length) {
                        setPreviewImages((prev) => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // Remove image from preview
    const removeImage = (index: number) => {
        setPreviewImages((prev) => prev.filter((_, i) => i !== index));
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const openModal = (type: 'create' | 'edit' | 'delete', product?: Product) => {
        if (type === 'edit' && product) {
            setSelectedProduct(product);
            setFormData({
                seller_id: product.seller_id, // Include seller_id from the product
                name: product.name,
                description: product.description || '',
                price: product.price,
                stock: product.stock,
                category_id: product.category_id,
                is_moderated: product.is_moderated,
                images: [],
            });
            setOldImageUrls(product.images.map((img) => img.image_product_url));
        } else if (type === 'delete' && product) {
            setSelectedProductId(product.id);
        }

        setModalState((prev) => ({ ...prev, [type]: true }));
    };

    const closeModal = useCallback(
        (type: 'create' | 'edit' | 'delete') => {
            setModalState((prev) => ({ ...prev, [type]: false }));
            if (type === 'edit') setSelectedProduct(null);
            if (type === 'delete') setSelectedProductId(null);
            resetForm();
        },
        [resetForm],
    );

    // Form submission handlers
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('seller_id', id.toString());
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price.toString());
        formDataToSend.append('stok', formData.stock.toString());
        formDataToSend.append('category_id', formData.category_id.toString());
        formDataToSend.append('is_moderated', formData.is_moderated);
        formData.images.forEach((image, index) => {
            formDataToSend.append(`images[${index}]`, image);
        });

        Inertia.post(route('admin.product.store'), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('create');
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Failed to create product. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price.toString());
        formDataToSend.append('stok', formData.stock.toString());
        formDataToSend.append('category_id', formData.category_id.toString());
        formDataToSend.append('is_moderated', formData.is_moderated);
        formData.images.forEach((image, index) => {
            formDataToSend.append(`images[${index}]`, image);
        });
        formDataToSend.append('_method', 'PUT');

        Inertia.post(route('admin.product.update', selectedProduct.id), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('edit');
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Failed to update product. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!selectedProductId) return;
        setIsSubmitting(true);

        Inertia.delete(route('admin.product.destroy', selectedProductId), {
            onSuccess: () => {
                closeModal('delete');
                toast.success('Product deleted successfully');
            },
            onError: () => toast.error('Failed to delete product'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (modalState.create) closeModal('create');
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
            <Head title="Products Management" />
            <ToastContainer position="top-right" autoClose={5000} />

            <div className="flex flex-col gap-4 p-4">
                <div className="rounded-xl border bg-white p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">List Products</h2>
                            <p className="text-sm text-gray-500">Manage your product inventory</p>
                        </div>
                        <button
                            onClick={() => openModal('create')}
                            className="flex size-7 items-center justify-center rounded bg-green-600 px-1 py-1 text-white transition hover:bg-green-700"
                        >
                            <CirclePlus size={18} />
                        </button>
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
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Filter Row */}
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                            {/* Category Filter */}
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            >
                                <option value="">All Status</option>
                                <option value="true">Approved</option>
                                <option value="false">Rejected</option>
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

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="flex items-center gap-3 px-4 py-3">
                                            {product.images.length > 0 ? (
                                                <img
                                                    src={product.images[0].image_product_url}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                                                    <ImageIcon className="text-gray-500" size={28} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="line-clamp-1 text-xs text-gray-500">{product.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{product.category.name}</td>
                                        <td className="px-4 py-3">{formatPriceDisplay(product.price)}</td>
                                        <td className="px-4 py-3">{product.stock}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                    product.is_moderated === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {product.is_moderated === 'true' ? 'Approved' : 'Rejected'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal('edit', product)}
                                                    className="rounded bg-yellow-500 p-1 text-white hover:bg-yellow-600"
                                                >
                                                    <SquarePen size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openModal('delete', product)}
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

            {/* Create Product Modal */}
            <ModalDialog isOpen={modalState.create} onClose={() => closeModal('create')} title="Create New Product" size="lg">
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input label="Product Name" name="name" value={formData.name} onChange={handleInputChange} required />
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                                required
                            >
                                <option value="">Select Category</option>
                                {(categories || [])
                                    .filter((c) => c.active === 'true')
                                    .map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <Input label="Price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                        <Input label="Stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} required />
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_moderated"
                                name="is_moderated"
                                checked={formData.is_moderated === 'true'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_moderated: e.target.checked ? 'true' : 'false',
                                    })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <label htmlFor="is_moderated" className="ml-2 block text-sm text-gray-700">
                                Approve Product
                            </label>
                        </div>
                    </div>
                    <Textarea label="Description" name="description" value={formData.description} onChange={handleInputChange} />
                    <MultiFileInput
                        label="Product Images"
                        name="images"
                        onChange={handleFileChange}
                        previews={previewImages}
                        onRemove={removeImage}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => closeModal('create')} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Product'
                            )}
                        </Button>
                    </div>
                </form>
            </ModalDialog>

            {/* Edit Product Modal */}
            <ModalDialog isOpen={modalState.edit} onClose={() => closeModal('edit')} title={`Edit Product`} size="lg">
                {selectedProduct && (
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input label="Product Name" name="name" value={formData.name} onChange={handleInputChange} required />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories
                                        .filter((c) => c.active === 'true')
                                        .map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <Input label="Price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                            <Input label="Stock" name="stok" type="number" value={formData.stock} onChange={handleInputChange} required />
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_moderated"
                                    name="is_moderated"
                                    checked={formData.is_moderated === 'true'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            is_moderated: e.target.checked ? 'true' : 'false',
                                        })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <label htmlFor="is_moderated" className="ml-2 block text-sm text-gray-700">
                                    Approve Product
                                </label>
                            </div>
                        </div>
                        <Textarea label="Description" name="description" value={formData.description} onChange={handleInputChange} />
                        <MultiFileInput
                            label="Product Images"
                            name="images"
                            onChange={handleFileChange}
                            previews={previewImages}
                            currentImages={oldImageUrls}
                            onRemove={removeImage}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="secondary" onClick={() => closeModal('edit')} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="warning" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Product'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </ModalDialog>

            {/* Delete Confirmation Modal */}
            <ModalDialog isOpen={modalState.delete} onClose={() => closeModal('delete')} title="Confirm Deletion" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this product? This action cannot be undone.</p>
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
                                'Delete Product'
                            )}
                        </Button>
                    </div>
                </div>
            </ModalDialog>
        </AppLayout>
    );
}
