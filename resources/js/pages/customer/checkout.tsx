import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { formatRupiah } from '@/lib/format';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Bell, LogOut, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    [key: string]: string | number;
}

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface CheckoutPageProps extends PageProps {
    notifications: Notification[];
}

export default function Checkout({ notifications }: CheckoutPageProps) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(notifications.filter((notification) => !notification.is_read).length);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const deliveryFee = 13000;
    const cleanup = useMobileNavigation();

    const { data, setData, post, processing, errors } = useForm<{
        address: string;
        items: CartItem[];
        [key: string]: string | number | boolean | CartItem[];
    }>({
        address: '',
        items: [],
    });

    useEffect(() => {
        const items = localStorage.getItem('cartItems');
        if (items) {
            const parsed = JSON.parse(items) as CartItem[];
            setCartItems(parsed);
            setData('items', parsed);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateCart = (updatedItems: CartItem[]) => {
        setCartItems(updatedItems);
        setData('items', updatedItems);
        localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    };

    const increaseQuantity = (id: number) => {
        const updatedItems = cartItems.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
        updateCart(updatedItems);
    };

    const decreaseQuantity = (id: number) => {
        const updatedItems = cartItems.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
        updateCart(updatedItems);
    };

    const removeItem = (id: number) => {
        const updatedItems = cartItems.filter((item) => item.id !== id);
        updateCart(updatedItems);
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryFee;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            alert('Keranjang belanja Anda kosong. Silakan tambahkan produk terlebih dahulu.');
            return;
        }

        post(route('customer.checkout.store'), {
            onSuccess: () => {
                // Clear local storage dan state
                localStorage.removeItem('cartItems');
                setCartItems([]);
                setData('items', []);
            },
        });
    };

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const markNotificationAsRead = async (id: number) => {
        try {
            await fetch(route('notifications.markAsRead'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ id }),
            });

            // Update UI lokal
            setUnreadNotifications((prev) => Math.max(0, prev - 1));
            // Atau: Refetch notifikasi jika diperlukan
        } catch (error) {
            console.error('Gagal menandai notifikasi sebagai dibaca:', error);
        }
    };

    const markAllNotificationsAsRead = () => {
        router.post(
            route('notifications.markAllAsRead'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['notifications'], // Pastikan props ini disertakan kembali di controller
            },
        );
    };
    return (
        <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
            <Head title={'Checkout'}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                <meta name="description" content="TaniMart - Marketplace produk pertanian terbaik" />
            </Head>

            {/* Header */}
            <header className="sticky top-0 z-10 bg-white shadow-sm dark:bg-[#0a0a0a]">
                <div className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/favicon.svg" alt="TaniMart Logo" className="h-10 w-10" />
                        <span className="hidden text-2xl font-bold md:flex">
                            Tani<span className="bg-gradient-to-r from-[#0D7E05] to-[#87C603] bg-clip-text text-transparent">Mart</span>
                        </span>
                    </Link>

                    <div className="relative w-1/2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-green-600" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products...."
                            className="block w-full rounded-md border border-green-400 bg-green-50 p-2 py-2 pr-3 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            disabled
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                            >
                                <Bell className="h-6 w-6" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div
                                    className="absolute right-0 w-80 origin-top-right rounded-md bg-white shadow-xl focus:outline-none dark:bg-gray-800"
                                    onMouseLeave={() => setIsNotifOpen(false)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <h3 className="text-lg font-medium">Notifications ({notifications.length})</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={markAllNotificationsAsRead}
                                                    className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                                >
                                                    Mark all as read
                                                </button>
                                                <button
                                                    onClick={() => setIsNotifOpen(false)}
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <Bell className="h-12 w-12 text-gray-400" />
                                                <p className="mt-4 text-gray-500">No notifications yet</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-96 overflow-y-auto">
                                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {notifications.map((notification) => (
                                                        <li
                                                            key={notification.id}
                                                            className={`px-2 py-3 ${!notification.is_read ? 'bg-green-50 dark:bg-gray-700' : ''}`}
                                                            onClick={() => markNotificationAsRead(notification.id)}
                                                        >
                                                            <p className="text-sm">{notification.message}</p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {new Date(notification.created_at).toLocaleString()}
                                                            </p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link href={route('register')} className="rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
                            Open Shop
                        </Link>

                        <Link
                            className="flex items-center justify-center rounded-md bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-700"
                            method="post"
                            href={route('logout')}
                            as="button"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2" />
                            Log out
                        </Link>
                    </div>
                </div>
            </header>

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                                        Alamat Pengiriman
                                    </label>
                                    <textarea
                                        id="address"
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                        placeholder="Masukkan alamat lengkap pengiriman..."
                                        value={data.address || ''}
                                        onChange={(e) => setData('address', e.target.value)}
                                        required
                                    />
                                    {errors.address && <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.address}</p>}
                                </div>

                                <div className="mb-6">
                                    <h2 className="mb-4 text-lg font-semibold">Pesanan Anda</h2>
                                    {cartItems.length === 0 ? (
                                        <p className="text-gray-500">Keranjang belanja Anda kosong.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {cartItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center space-x-4">
                                                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover" />
                                                        <div>
                                                            <h3 className="font-medium">{item.name}</h3>
                                                            <p className="text-sm text-gray-500">{formatRupiah(item.price)} per item</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => decreaseQuantity(item.id)}
                                                                className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center">{item.quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => increaseQuantity(item.id)}
                                                                className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <div className="w-24 text-right font-medium">{formatRupiah(item.price * item.quantity)}</div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.id)}
                                                            className="ml-2 text-red-500 hover:text-red-700"
                                                            title="Hapus item"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {cartItems.length > 0 && (
                                    <div className="mb-6 border-t pt-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Subtotal</span>
                                                <span>{formatRupiah(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Biaya Pengiriman</span>
                                                <span>{formatRupiah(deliveryFee)}</span>
                                            </div>
                                            <div className="mt-2 flex justify-between text-lg font-bold">
                                                <span>Total</span>
                                                <span>{formatRupiah(total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || cartItems.length === 0}
                                    className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white focus:ring-4 focus:outline-none ${
                                        processing || cartItems.length === 0
                                            ? 'cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                                    }`}
                                >
                                    {processing ? 'Memproses...' : 'Konfirmasi Pesanan'}
                                </button>
                            </form>

                            {notifications.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="mb-3 text-lg font-semibold">Notifikasi Terbaru</h2>
                                    <div className="space-y-2">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`rounded-lg p-3 ${!notification.is_read ? 'bg-blue-50 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}
                                            >
                                                <p>{notification.message}</p>
                                                <p className="mt-1 text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
