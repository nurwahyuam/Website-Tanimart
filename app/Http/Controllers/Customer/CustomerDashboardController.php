<?php

namespace App\Http\Controllers\Customer;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Notification;
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

        $notifications = Notification::where('user_id', $userId)->Get();

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

        return Inertia::render('customer/detail-product', [
            'product' => $product,
            'categories' => $categories,
            'averageRating' => $averageRating,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function checkout(Product $product){
        return Inertia::render('customer/checkout');
    }
}
