<?php

namespace App\Http\Controllers\Customer;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class CustomerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::user()->id;
        $search = $request->input('search');
        $category = $request->input('category');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');
        $limit = $request->input('limit', 8);

        $products = Product::with(['category', 'seller', 'images', 'reviews'])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $products->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($category) {
            $products->where('category_id', $category);
        }

        if ($minPrice) {
            $products->where('price', '>=', $minPrice);
        }

        if ($maxPrice) {
            $products->where('price', '<=', $maxPrice);
        }

        $paginatedProducts = $products->paginate($limit)->through(function ($product) {
            $product->average_rating = round($product->reviews->avg('rating'), 1);
            return $product;
        });

        $categories = Category::where('active', true)->get();

        $notifications = Notification::where('user_id' , $userId)->latest()->take(5)->get();

        return inertia('customer/home', [
            'products' => $paginatedProducts,
            'categories' => $categories,
            'notifications' => $notifications,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
                'limit' => $limit
            ],
        ]);
    }

    public function show(Product $product)
    {
        $userId = Auth::user()->id;
        // Eager load necessary relationships
        $product->load(['category', 'seller', 'images', 'reviews.user']);

        // Calculate average rating
        $averageRating = $product->reviews->avg('rating');

        // Get related products
        $relatedProducts = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_moderated', true)
            ->with(['category', 'seller', 'images'])
            ->inRandomOrder()
            ->limit(4)
            ->get();

        $categories = Category::where('active', true)->get();

        $notifications = Notification::where('user_id' , $userId)->latest()->take(5)->get();

        return Inertia::render('customer/detail-product', [
            'product' => $product,
            'categories' => $categories,
            'notifications' => $notifications,
            'averageRating' => $averageRating,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function checkout(Product $product){
        $userId = Auth::user()->id;

        $notifications = Notification::where('user_id' , $userId)->latest()->take(5)->get();

         return Inertia::render('customer/checkout', [
            'notifications' => $notifications,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'address' => 'required|string|max:255',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        // Calculate total price
        $total = collect($request->items)->sum(function ($item) {
            return $item['price'] * $item['quantity'];
        }) + 13000; // Add delivery fee

        // Create order
        $order = Order::create([
            'customer_id' => Auth::id(),
            'total_price' => $total,
            'status' => 'pending',
        ]);

        // Create order items
        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ]);
        }

        // Create notification
        Notification::create([
            'user_id' => Auth::id(),
            'message' => 'Pesanan #' . $order->id . $order->created_at->format('dmy') . ' telah dibuat dan sedang menunggu pembayaran',
            'is_read' => false,
        ]);

        return redirect()->route('customer.home')->with('success', 'Pesanan berhasil dibuat!');
    }
}
