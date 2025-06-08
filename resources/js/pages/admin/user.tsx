import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CirclePlus, CircleUser, Image, Loader2, SquarePen, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

type UserRole = 'admin' | 'seller' | 'customer';

interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    profile_photo: string | null;
    no_phone: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersPagination {
    data: User[];
    current_page: number;
    last_page: number;
    links: PaginationLink[];
}

interface FlashMessage {
    success?: string;
    error?: string;
}

interface Props {
    users: UsersPagination;
    flash?: FlashMessage;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users Management',
        href: '/admin/users',
    },
];

export default function Index({ users, flash }: Props) {
    // Modal states
    const [modalState, setModalState] = useState({
        create: false,
        edit: false,
        delete: false,
    });

    // Data states
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [oldPhotoUrl, setOldPhotoUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '' as UserRole | '',
        no_phone: '',
        profile_photo: null as File | null,
    });

    // Reset form to initial state
    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            no_phone: '',
            profile_photo: null,
        });
        setPreviewImage(null);
        setOldPhotoUrl(null);
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

    // Handle file input changes
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setFormData((prev) => ({ ...prev, profile_photo: file }));

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Modal handlers
    const openModal = (type: 'create' | 'edit' | 'delete', user?: User) => {
        if (type === 'edit' && user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                no_phone: user.no_phone || '',
                profile_photo: null,
            });
            setOldPhotoUrl(user.profile_photo ? `/storage/profile_photos/${user.profile_photo}` : null);
        } else if (type === 'delete' && user) {
            setSelectedUserId(user.id);
        }

        setModalState((prev) => ({ ...prev, [type]: true }));
    };

    // First, memoize the closeModal functions to prevent unnecessary recreations
    const closeModal = useCallback((type: 'create' | 'edit' | 'delete') => {
        setModalState((prev) => ({ ...prev, [type]: false }));
        if (type === 'edit') setSelectedUser(null);
        if (type === 'delete') setSelectedUserId(null);
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

        Inertia.post(route('admin.user.store'), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('create');
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Failed to create user. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && (key !== 'password' || value !== '')) {
                formDataToSend.append(key, value);
            }
        });
        formDataToSend.append('_method', 'PUT');

        Inertia.post(route('admin.user.update', selectedUser.id), formDataToSend, {
            forceFormData: true,
            onSuccess: () => {
                closeModal('edit');
            },
             onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Failed to create user. Please check the form.', {
                    position: 'top-right',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteConfirm = () => {
        if (!selectedUserId) return;
        setIsSubmitting(true);

        Inertia.delete(route('admin.user.destroy', selectedUserId), {
            onSuccess: () => {
                closeModal('delete');
                toast.success('User deleted successfully');
            },
            onError: () => toast.error('Failed to delete user'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Then update your useEffect to include closeModal in dependencies
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
    }, [modalState, closeModal]); // Add closeModal to dependencies

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

    // Handle pagination change
    const handlePageChange = (page: number) => {
        Inertia.visit(route('admin.user.index', { page }), {
            preserveState: true,
        });
    };

    // Get role badge color
    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'seller':
                return 'bg-purple-100 text-purple-800';
            case 'customer':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Management" />
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
                                <h2 className="text-xl font-semibold text-gray-800">List Users</h2>
                                <p className="text-sm text-gray-500">A list of all users in your account including their names, emails, and roles.</p>
                            </div>
                            <button
                                onClick={() => openModal('create')}
                                className="flex size-7 items-center justify-center rounded bg-green-600 px-1 py-1 text-white transition hover:bg-green-700"
                                aria-label="Add new user"
                            >
                                <CirclePlus size={18} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Role</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="flex items-center gap-3 px-4 py-3">
                                                {user.profile_photo ? (
                                                    <img
                                                        src={`/storage/profile_photos/${user.profile_photo}`}
                                                        alt={user.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                                                        <CircleUser className="text-gray-500" size={28} />
                                                    </div>
                                                )}
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="flex items-center justify-center gap-1 px-4 py-3">
                                                <button
                                                    onClick={() => openModal('edit', user)}
                                                    className="flex size-6 items-center justify-center rounded bg-yellow-500 px-1 py-1 text-white transition hover:bg-yellow-600"
                                                    aria-label={`Edit ${user.name}`}
                                                >
                                                    <SquarePen size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openModal('delete', user)}
                                                    className="flex size-6 items-center justify-center rounded bg-red-500 px-1 py-1 text-white transition hover:bg-red-600"
                                                    aria-label={`Delete ${user.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination currentPage={users.current_page} totalPages={users.last_page} onPageChange={handlePageChange} />
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            <ModalDialog isOpen={modalState.create} onClose={() => closeModal('create')} title="Create New User">
                <form onSubmit={handleCreateSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        <Input label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                        <div className="justify- flex items-center gap-2">
                            <Input label="Phone Number" name="no_phone" value={formData.no_phone} onChange={handleInputChange} />
                            <div className="w-full">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleSelectChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Pilih Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="seller">Seller</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>
                        </div>
                        <FileInput label="Profile Photo" name="profile_photo" onChange={handleFileChange} preview={previewImage} />
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
                                'Create User'
                            )}
                        </Button>
                    </div>
                </form>
            </ModalDialog>

            {/* Edit User Modal */}
            <ModalDialog isOpen={modalState.edit} onClose={() => closeModal('edit')} title={`Edit User`}>
                {selectedUser && (
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                            <Input
                                label="New Password (Optional)"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Leave blank to keep current password"
                            />
                            <div className="item-center flex justify-center gap-2">
                                <Input label="Phone Number" name="no_phone" value={formData.no_phone} onChange={handleInputChange} />
                                <div className="w-full">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleSelectChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        required
                                    >
                                        <option value="">Pilih Role</option>
                                        <option value="admin">Admin</option>
                                        <option value="seller">Seller</option>
                                        <option value="customer">Customer</option>
                                    </select>
                                </div>
                            </div>
                            <FileInput
                                label="Profile Photo"
                                name="profile_photo"
                                onChange={handleFileChange}
                                preview={previewImage}
                                currentImage={oldPhotoUrl}
                            />
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
                                    'Update User'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </ModalDialog>

            {/* Delete Confirmation Modal */}
            <ModalDialog isOpen={modalState.delete} onClose={() => closeModal('delete')} title="Confirm Deletion" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this user? This action cannot be undone.</p>
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
                                'Delete User'
                            )}
                        </Button>
                    </div>
                </div>
            </ModalDialog>
        </AppLayout>
    );
}

// Add this type definition near your other type definitions
type ModalSize = 'sm' | 'md' | 'lg';

// Add this constant definition before your ModalDialog component
const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

// Then update your ModalDialog component to use the type and constant
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
    size?: ModalSize; // Use the ModalSize type here
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
        <div className='w-full'>
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

// Reusable File Input Component
function FileInput({
    label,
    name,
    onChange,
    preview,
    currentImage,
}: {
    label: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    preview: string | null;
    currentImage?: string | null;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
                    ) : currentImage ? (
                        <img src={currentImage} alt="Current" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                            <Image className="text-gray-400" size={20} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <input
                        type="file"
                        id={name}
                        name={name}
                        accept="image/*"
                        onChange={onChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
            </div>
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
