import { Button } from '@/components/button';
import ImageCarousel from '@/components/ImageCarousel';
import Pagination from '@/components/ui/pagination';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { formatRupiah } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Frown, LogOut, Mail, MapPin, Phone, RotateCcw, Search, ShoppingCart, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Category {
    id: number;
    name: string;
    active: 'true' | 'false';
}

interface Notification {
    id: number;
    message: string | null;
    is_read: boolean;
    created_at: string;
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
        rating: number;
    };
    rating?: number;
    created_at: string;
}

interface Props {
    id: number;
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    notifications: Notification[];
}

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    stock: number;
    seller_id: number;
}

export default function HomePage({ products: initialProducts, categories, notifications }: Props) {
    const images = ['/images/banner1.jpg', '/images/banner2.jpg', '/images/banner3.jpg'];
    const [allProducts] = useState<Product[]>(initialProducts.data);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts.data);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        sort: 'newest',
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(notifications.filter((notification) => !notification.is_read).length);
    const cleanup = useMobileNavigation();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = useMemo(() => Math.ceil(filteredProducts.length / itemsPerPage), [filteredProducts]);
    const hasActiveFilters = useMemo(() => searchTerm.trim() !== '' || filters.category !== '' || filters.sort !== 'newest', [searchTerm, filters]);

    useEffect(() => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                setCartItems(parsedCart);
            } catch (error) {
                console.error('Failed to parse cart items', error);
                localStorage.removeItem('cartItems');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Filter and sort products
    useEffect(() => {
        let results = [...allProducts];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    (p.description && p.description.toLowerCase().includes(term)) ||
                    p.seller?.name.toLowerCase().includes(term),
            );
        }

        // Apply category filter
        if (filters.category) {
            results = results.filter((p) => p.category_id === Number(filters.category));
        }

        // Apply sorting
        switch (filters.sort) {
            case 'price_asc':
                results.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                results.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                // Assuming products have a rating property
                results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
            default:
                results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        setFilteredProducts(results);
        setCurrentPage(1);
    }, [allProducts, searchTerm, filters]);

    // Paginate products
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        setDisplayedProducts(filteredProducts.slice(startIndex, startIndex + itemsPerPage));
    }, [filteredProducts, currentPage]);

    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({
            category: '',
            sort: 'newest',
        });
    }, []);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const addToCart = async (product: Product) => {
        const updatedCartItems = [...cartItems];
        const existingItem = updatedCartItems.find((item) => item.id === product.id);

        if (existingItem) {
            const newQuantity = Math.min(existingItem.quantity + 1, product.stock);
            existingItem.quantity = newQuantity;
        } else {
            updatedCartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.images[0]?.image_product_url || '/images/placeholder-product.jpg',
                stock: product.stock,
                seller_id: product.seller_id,
            });
        }

        setCartItems(updatedCartItems);
        setIsCartOpen(true);
    };

    const removeFromCart = (productId: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }

        const product = cartItems.find((item) => item.id === productId);
        if (product) {
            newQuantity = Math.min(newQuantity, product.stock);
        }

        setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cartItems');
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

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check if all items in cart are from the same seller
    const isSingleSellerCart = useMemo(() => {
        if (cartItems.length === 0) return true;
        const firstSellerId = cartItems[0].seller_id;
        return cartItems.every((item) => item.seller_id === firstSellerId);
    }, [cartItems]);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
            <Head title="Home">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                <meta name="description" content="TaniMart - Marketplace produk pertanian terbaik" />
            </Head>

            {/* Header */}
            <header className="sticky top-0 z-10 bg-white shadow-sm dark:bg-[#0a0a0a]">
                <div className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/home" className="flex items-center gap-2">
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border border-green-400 bg-green-50 p-2 py-2 pr-3 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
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
                                    className="ring-opacity-5 absolute right-0 w-80 origin-top-right rounded-md bg-white shadow-xl focus:outline-none dark:bg-gray-800"
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

                        {/* {Auth::user()->profile_image && (

                        ) : (

                        )} */}

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

            <main className="container mx-auto px-4 py-3">
                {/* Banner Carousel */}
                <div className="mb-3 overflow-hidden rounded-xl shadow-lg">
                    <ImageCarousel images={images} />
                </div>

                {/* Filter Section */}
                <div className="flex items-center justify-end gap-2">
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

                    {/* Sort Options */}
                    <select
                        value={filters.sort}
                        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                        className="rounded-md border border-gray-300 p-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    >
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                    </select>

                    {/* Clear Button */}
                    <Button
                        onClick={clearAllFilters}
                        variant={hasActiveFilters ? 'danger' : 'secondary'}
                        disabled={!hasActiveFilters}
                        className="flex items-center justify-center"
                    >
                        {hasActiveFilters && <RotateCcw className="mr-2 h-4 w-4" />}
                        Clear Filters
                    </Button>
                </div>

                {/* Products Section */}
                <section className="mt-3">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Latest Products</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {displayedProducts.length} of {filteredProducts.length} products
                        </p>
                    </div>

                    {displayedProducts.length === 0 ? (
                        <div className="rounded-lg bg-gray-100 p-8 text-center dark:bg-gray-800">
                            <Frown className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium">No products found</h3>
                            <p className="mt-1 text-gray-500">Try using different keywords or filters</p>
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {displayedProducts.map(
                                    (product) =>
                                        product.is_moderated === 'true' && (
                                            <div
                                                key={product.id}
                                                className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-gray-800"
                                            >
                                                <Link href={route('customer.detail-product', { product: product.name })}>
                                                    <div className="relative aspect-square w-full overflow-hidden">
                                                        <img
                                                            src={product.images[0]?.image_product_url || '/images/placeholder-product.jpg'}
                                                            alt={product.name}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                        {product.stock <= 0 && (
                                                            <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
                                                                <span className="rounded bg-red-500 px-2 py-1 text-sm font-bold text-white">
                                                                    Sold Out
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                {product.category.name}
                                                            </span>
                                                            <div className="flex items-center text-sm text-yellow-500">
                                                                <Star className="h-4 w-4 fill-current" />
                                                                <span className="ml-1">{product.rating?.toFixed(1) || '0.0'}</span>
                                                            </div>
                                                        </div>
                                                        <h3 className="mb-1 truncate font-medium">{product.name}</h3>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-green-600">{formatRupiah(product.price)}/kg</span>
                                                            <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {product.stock > 0 ? 'Stock: ' + product.stock : 'Out of Stock'}
                                                            </span>
                                                        </div>
                                                        {product.seller && (
                                                            <p className="mt-1 truncate text-xs text-gray-500">by {product.seller.name}</p>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="border-t px-4 py-2">
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        disabled={product.stock <= 0}
                                                        className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
                                                            product.stock > 0
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : 'cursor-not-allowed bg-gray-200 text-gray-500'
                                                        }`}
                                                    >
                                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                                    </button>
                                                </div>
                                            </div>
                                        ),
                                )}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>

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
                                        <Link
                                            href={`/?category=${cat.id}`}
                                            className="hover:text-green-600"
                                            onClick={() => setFilters({ ...filters, category: cat.id.toString() })}
                                        >
                                            {cat.name}
                                        </Link>
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
