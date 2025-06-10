import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { formatRupiah } from '@/lib/format';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, ChevronLeft, LogOut, Mail, MapPin, Phone, Search, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductImage {
    id: number;
    image_product_url: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    is_moderated: boolean;
    category: {
        id: number;
        name: string;
    };
    seller?: {
        id: number;
        name: string;
    };
    images: ProductImage[];
    reviews: Array<{
        id: number;
        rating: number;
        comment: string;
        created_at: string;
        user: {
            id: number;
            name: string;
        };
    }>;
}

interface Category {
    id: number;
    name: string;
    active: 'true' | 'false';
}

interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
}

interface Props {
    id: number;
    categories: Category[];
    notifications: Notification[];
}

interface ProductDetailProps {
    product: Product;
    averageRating: number;
    relatedProducts: Product[];
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    stock: number;
    image: string;
    seller_id: number;
}

export default function ProductDetail({ categories, notifications }: Props) {
    const cleanup = useMobileNavigation();
    const { product, averageRating, relatedProducts } = usePage<PageProps & ProductDetailProps>().props;
    const [selectedImage, setSelectedImage] = useState(product.images[0]?.image_product_url || '/images/placeholder-product.jpg');
    const [quantity, setQuantity] = useState(1);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(notifications.filter((notification) => !notification.is_read).length);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    // Load cart from localStorage
    useEffect(() => {
        const loadCart = () => {
            try {
                const cartData = localStorage.getItem('cartItems');
                if (cartData) {
                    setCartItems(JSON.parse(cartData));
                }
            } catch (error) {
                console.error('Failed to load cart from localStorage', error);
            }
        };

        loadCart();
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cartItems.length > 0) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } else {
            localStorage.removeItem('cartItems');
        }
    }, [cartItems]);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isSingleSellerCart = new Set(cartItems.map((item) => item.seller_id)).size === 1;

    const handleAddToCart = () => {
        // Check if product already exists in cart
        const existingItem = cartItems.find((item) => item.product_id === product.id);

        if (existingItem) {
            const updatedCart = cartItems.map((item) =>
                item.product_id === product.id
                    ? {
                          ...item,
                          quantity: Math.min(item.quantity + quantity, product.stock),
                          stock: product.stock, // Update stock in case it changed
                      }
                    : item,
            );
            setCartItems(updatedCart);
        } else {
            const newItem: CartItem = {
                id: Date.now(), // Temporary ID
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                stock: product.stock,
                image: product.images[0]?.image_product_url || '/images/placeholder-product.jpg',
                seller_id: product.seller?.id || 0,
            };
            setCartItems([...cartItems, newItem]);
        }

        setToast({ show: true, message: 'Product added to cart', type: 'success' });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const updateQuantity = (id: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: Math.min(newQuantity, item.stock) } : item)));
    };

    const removeFromCart = (id: number) => {
        setCartItems(cartItems.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
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

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
            <Head title={`${product.name} | TaniMart`}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                <meta name="description" content={product.description.substring(0, 160)} />
            </Head>

            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-4 right-4 z-50 rounded-md p-4 shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
                >
                    <div className="flex items-center">
                        <span>{toast.message}</span>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-4">
                            ×
                        </button>
                    </div>
                </div>
            )}

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
                            placeholder="Search products..."
                            className="block w-full rounded-md border border-green-400 bg-green-50 p-2 py-2 pr-3 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                            disabled
                        />
                    </div>

                    <div className="flex items-center gap-3">
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
                        {/* Cart Dropdown */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setIsCartOpen(true)}
                                onMouseLeave={() => setIsCartOpen(false)}
                                className="relative p-2 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                            >
                                <ShoppingCart className="h-6 w-6" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            {isCartOpen && (
                                <div
                                    className="ring-opacity-5 absolute right-0 z-20 w-80 origin-top-right rounded-md bg-white shadow-xl focus:outline-none dark:bg-gray-800"
                                    onMouseEnter={() => setIsCartOpen(true)}
                                    onMouseLeave={() => setIsCartOpen(false)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <h3 className="text-lg font-medium">Shopping Cart ({totalItems})</h3>
                                            <button
                                                onClick={() => setIsCartOpen(false)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {cartItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <ShoppingCart className="h-12 w-12 text-gray-400" />
                                                <p className="mt-4 text-gray-500">Your cart is empty</p>
                                            </div>
                                        ) : (
                                            <>
                                                {!isSingleSellerCart && (
                                                    <div className="my-2 rounded bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                        Items from different sellers will be processed separately
                                                    </div>
                                                )}
                                                <div className="max-h-96 overflow-y-auto">
                                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {cartItems.map((item) => (
                                                            <li key={item.id} className="py-4">
                                                                <div className="flex items-center">
                                                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                                        <img
                                                                            src={item.image}
                                                                            alt={item.name}
                                                                            className="h-full w-full object-cover"
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.src = '/images/placeholder-product.jpg';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="ml-4 flex-1">
                                                                        <div className="flex justify-between text-base">
                                                                            <h3 className="font-medium">{item.name}</h3>
                                                                            <p className="ml-4">{formatRupiah(item.price)}</p>
                                                                        </div>
                                                                        <div className="mt-1 flex items-center justify-between text-sm">
                                                                            <div className="flex items-center">
                                                                                <button
                                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                                    className="h-6 w-6 rounded border text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                                                >
                                                                                    -
                                                                                </button>
                                                                                <span className="mx-2">{item.quantity}</span>
                                                                                <button
                                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                                    disabled={item.quantity >= item.stock}
                                                                                    className={`h-6 w-6 rounded border text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${
                                                                                        item.quantity >= item.stock
                                                                                            ? 'cursor-not-allowed opacity-50'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => removeFromCart(item.id)}
                                                                                className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                                    <div className="flex justify-between text-lg font-bold">
                                                        <span>Total</span>
                                                        <span>{formatRupiah(totalPrice)}</span>
                                                    </div>
                                                    <div className="mt-4 flex space-x-2">
                                                        <button
                                                            onClick={clearCart}
                                                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                                        >
                                                            Clear Cart
                                                        </button>
                                                        <Link
                                                            href={route('customer.checkout')}
                                                            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
                                                        >
                                                            Checkout
                                                        </Link>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/register" className="rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
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

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/home" className="flex items-center text-gray-600 hover:text-green-600">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1">Back to Products</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Product Images */}
                    <div>
                        <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                            <img
                                src={selectedImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/placeholder-product.jpg';
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.length > 0 ? (
                                product.images.map((image) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImage(image.image_product_url)}
                                        className={`aspect-square overflow-hidden rounded-md border-2 ${selectedImage === image.image_product_url ? 'border-green-500' : 'border-transparent'}`}
                                    >
                                        <img
                                            src={image.image_product_url}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/images/placeholder-product.jpg';
                                            }}
                                        />
                                    </button>
                                ))
                            ) : (
                                <div className="aspect-square overflow-hidden rounded-md border-2 border-transparent bg-gray-200"></div>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                {product.category.name}
                            </span>
                        </div>

                        <h1 className="mb-2 text-2xl font-bold">{product.name}</h1>

                        <div className="mb-4 flex items-center">
                            <div className="flex items-center">
                                <div className="flex text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-5 w-5 ${i < Math.floor(averageRating) ? 'fill-current' : ''}`} />
                                    ))}
                                </div>
                                <span className="ml-1 text-gray-700 dark:text-gray-300">
                                    {averageRating?.toFixed(1) || '0.0'} • {product.reviews.length} reviews
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatRupiah(product.price)}/kg</span>
                            {product.stock > 0 ? (
                                <span className="ml-2 text-sm text-green-600 dark:text-green-400">Stock: {product.stock}</span>
                            ) : (
                                <span className="ml-2 text-sm text-red-600 dark:text-red-400">Out of Stock</span>
                            )}
                        </div>

                        {product.seller && (
                            <div className="mb-6">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Sold by: <span className="font-medium">{product.seller.name}</span>
                                </p>
                            </div>
                        )}

                        <div className="mb-8">
                            <h2 className="mb-2 text-lg font-semibold">Description</h2>
                            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{product.description}</p>
                        </div>

                        {product.stock > 0 ? (
                            <div className="mb-6 flex items-center">
                                <div className="mr-4">
                                    <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quantity
                                    </label>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="h-10 w-10 rounded-l-md border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            id="quantity"
                                            min="1"
                                            max={product.stock}
                                            value={quantity}
                                            onChange={(e) => {
                                                const value = Math.max(1, Math.min(Number(e.target.value), product.stock));
                                                setQuantity(isNaN(value) ? 1 : value);
                                            }}
                                            className="h-10 w-14 border-t border-b border-gray-300 text-center dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                        />
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="h-10 w-10 rounded-r-md border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="mt-6 flex items-center justify-center rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                                    disabled={quantity > product.stock}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Add to Cart
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
                                This product is currently out of stock. Check back later!
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-12">
                    <h2 className="mb-6 text-xl font-bold">Customer Reviews</h2>

                    {product.reviews.length > 0 ? (
                        <div className="space-y-6">
                            {product.reviews.map((review) => (
                                <div key={review.id} className="rounded-lg border p-4 dark:border-gray-700">
                                    <div className="mb-2 flex items-center">
                                        <div className="flex items-center text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`} />
                                            ))}
                                        </div>
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="font-medium">{review.user.name}</h3>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border p-8 text-center dark:border-gray-700">
                            <Star className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review this product!</p>
                        </div>
                    )}
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="mb-6 text-xl font-bold">You May Also Like</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct.id}
                                    className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-gray-800"
                                >
                                    <Link href={`/product/detail/${relatedProduct.name}`}>
                                        <div className="relative aspect-square w-full overflow-hidden">
                                            <img
                                                src={relatedProduct.images[0]?.image_product_url || '/images/placeholder-product.jpg'}
                                                alt={relatedProduct.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/images/placeholder-product.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="mb-1 truncate font-medium">{relatedProduct.name}</h3>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                    {formatRupiah(relatedProduct.price)}/kg
                                                </span>
                                                {relatedProduct.stock > 0 ? (
                                                    <span className="text-xs text-green-600 dark:text-green-400">In Stock</span>
                                                ) : (
                                                    <span className="text-xs text-red-600 dark:text-red-400">Sold Out</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800">
                <div className="container mx-auto border-t px-4 py-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div>
                            <h3 className="mb-4 flex items-center text-lg font-semibold">
                                <img src="/favicon.svg" alt="TaniMart Logo" className="mr-2 h-6 w-6" />
                                TaniMart
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Trusted agricultural marketplace connecting farmers directly with consumers.
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase">Links</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>
                                    <Link href="/about" className="hover:text-green-600">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/how-to-shop" className="hover:text-green-600">
                                        How to Shop
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/terms" className="hover:text-green-600">
                                        Terms & Conditions
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy" className="hover:text-green-600">
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase">Categories</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {categories.slice(0, 5).map((cat) => (
                                    <li key={cat.id}>
                                        <h1>{cat.name}</h1>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase">Contact Us</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4" />
                                    +62 812 3456 7890
                                </li>
                                <li className="flex items-center">
                                    <Mail className="mr-2 h-4 w-4" />
                                    hello@tanimart.id
                                </li>
                                <li className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Jl. Pertanian No. 123, Jakarta
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} TaniMart. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
