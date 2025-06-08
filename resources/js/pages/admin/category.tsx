import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CirclePlus, Loader2, SquarePen, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

type CategoryActive = 'true' | 'false';

interface Category {
    id: number;
    name: string;
    active: CategoryActive;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface CategoriesPagination {
    data: Category[];
    current_page: number;
    last_page: number;
    links: PaginationLink[];
}

interface FlashMessage {
    success?: string;
    error?: string;
}

interface Props {
    categories: CategoriesPagination;
    flash?: FlashMessage;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categoeies Management',
        href: '/admin/categories',
    },
];

export default function Index({ categories, flash }: Props) {
    // Modal states
    const [modalState, setModalState] = useState({
        create: false,
        edit: false,
        delete: false,
    });

    // Data states
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        active: '' as CategoryActive | '',
    });

    // Reset form to initial state
    const resetForm = () => {
        setFormData({
            name: '',
            active: '',
        });
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Modal handlers
    const openModal = (type: 'create' | 'edit' | 'delete', category?: Category) => {
        if (type === 'edit' && category) {
            setSelectedCategory(category);
            setFormData({
                name: category.name,
                active: category.active,
            });
        } else if (type === 'delete' && category) {
            setSelectedCategoryId(category.id);
        }

        setModalState((prev) => ({ ...prev, [type]: true }));
    };

    const closeModal = useCallback((type: 'create' | 'edit' | 'delete') => {
        setModalState((prev) => ({ ...prev, [type]: false }));
        if (type === 'edit') setSelectedCategory(null);
        if (type === 'delete')  setSelectedCategoryId(null);
        resetForm();
    }, []);

    // Form submission handlers
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                formDataToSend.append(key, value);
            }
        });

        Inertia.post(route('admin.category.store'), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('create');
            },
            onError: () => {
                toast.error('Failed to create category. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                formDataToSend.append(key, value);
            }
        });
        formDataToSend.append('_method', 'PUT');

        Inertia.post(route('admin.category.update', selectedCategory.id), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('edit');
            },
            onError: () => {
                toast.error('Failed to create category. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!selectedCategoryId) return;
        setIsSubmitting(true);

        Inertia.delete(route('admin.category.destroy', selectedCategoryId), {
            onSuccess: () => {
                closeModal('delete');
            },
            onError: () => toast.error('Failed to delete category'),
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

    const handlePageChange = (page: number) => {
        Inertia.visit(route('admin.category.index', { page }), {
            preserveState: true,
        });
    };

    // Get role badge color
    const getRoleBadgeColor = (active: CategoryActive) => {
        switch (active) {
            case 'true':
                return 'bg-green-100 text-green-800';
            case 'false':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories Management" />
            <ToastContainer
                position="top-right"
                autoClose={1500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <div className="rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">List Categories</h2>
                                <p className="text-sm text-gray-500">A list of all categories including their names and actives.</p>
                            </div>
                            <button
                                onClick={() => openModal('create')}
                                className="flex size-7 items-center justify-center rounded bg-green-600 px-1 py-1 text-white transition hover:bg-green-700"
                                aria-label="Add New Category"
                            >
                                <CirclePlus size={18} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Active</th>
                                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {categories.data.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{category.name}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getRoleBadgeColor(category.active)}`}
                                                >
                                                    {category.active}
                                                </span>
                                            </td>
                                            <td className="flex items-center justify-center gap-1 px-4 py-3">
                                                <button
                                                    onClick={() => openModal('edit', category)}
                                                    className="flex size-6 items-center justify-center rounded bg-yellow-500 px-1 py-1 text-white transition hover:bg-yellow-600"
                                                    aria-label={`Edit ${category.name}`}
                                                >
                                                    <SquarePen size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openModal('delete', category)}
                                                    className="flex size-6 items-center justify-center rounded bg-red-500 px-1 py-1 text-white transition hover:bg-red-600"
                                                    aria-label={`Delete ${category.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination currentPage={categories.current_page} totalPages={categories.last_page} onPageChange={handlePageChange} />
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            <ModalDialog isOpen={modalState.create} onClose={() => closeModal('create')} title="Create New User">
                <form onSubmit={handleCreateSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                        <div className="w-full">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Active <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="active"
                                value={formData.active}
                                onChange={handleSelectChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                                required
                            >
                                <option value="">Pilih Active</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>
                    </div>
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
                                'Create Category'
                            )}
                        </Button>
                    </div>
                </form>
            </ModalDialog>

            {/* Edit User Modal */}
            <ModalDialog isOpen={modalState.edit} onClose={() => closeModal('edit')} title={`Edit Category`}>
                {selectedCategory && (
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                            <div className="w-full">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Active <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="active"
                                    value={formData.active}
                                    onChange={handleSelectChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Pilih Active</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            </div>
                        </div>
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
                                    'Update Category'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </ModalDialog>

            {/* Delete Confirmation Modal */}
            <ModalDialog isOpen={modalState.delete} onClose={() => closeModal('delete')} title="Confirm Deletion" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this category? This action cannot be undone.</p>
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
                                'Delete Category'
                            )}
                        </Button>
                    </div>
                </div>
            </ModalDialog>
        </AppLayout>
    );
}

type ModalSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

function ModalDialog({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: ModalSize;
}) {
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && e.target === e.currentTarget) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white p-6 shadow-xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="mb-4 text-xl font-semibold text-gray-800">{title}</h2>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Reusable Input Component
function Input({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
}: {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div className="w-full">
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
        </div>
    );
}

// Reusable Button Component
function Button({
    type = 'button',
    variant = 'primary',
    onClick,
    children,
    disabled = false,
}: {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'warning' | 'danger';
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const variantClasses = {
        primary: 'bg-green-600 hover:bg-green-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none ${variantClasses[variant]} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            {children}
        </button>
    );
}
