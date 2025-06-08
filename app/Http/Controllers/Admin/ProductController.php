<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $category = $request->input('category');
        $status = $request->input('status');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');

        $products = Product::with(['category', 'seller', 'images'])
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

        if ($status !== null) {
            $products->where('is_moderated', $status);
        }

        if ($minPrice) {
            $products->where('price', '>=', $minPrice);
        }

        if ($maxPrice) {
            $products->where('price', '<=', $maxPrice);
        }

        $products = $products->paginate(4)
            ->appends([
                'search' => $search,
                'category' => $category,
                'status' => $status,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
            ]);

        $categories = Category::where('active', 'true')->get();

        return Inertia::render('admin/product', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'min_price', 'max_price']),
            'role' => Auth::user()->role,
            'id' => Auth::user()->id,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric',
            'stok' => 'required|integer',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $product = Product::create([
            'seller_id' => $request->seller_id,
            'name' => $request->name,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'price' => $request->price,
            'stock' => $request->stok,
            'is_moderated' => $request->is_moderated,
        ]);

        // Simpan gambar
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_product_url' => '/storage/' . $path,
                ]);
            }
        }

        return redirect()->route('admin.product.index')->with(['success' => 'User created successfully!']);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'is_moderated' => 'required|in:true,false',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $product->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'stok' => $validated['stok'],
            'category_id' => $validated['category_id'],
            'is_moderated' => $validated['is_moderated'] === 'true',
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('products', 'public');

                $product->images()->create([
                    'image_product_url' => '/storage/' . $path,
                ]);
            }
        }

        return redirect()->route('admin.product.index')->with(['success' => 'User updated successfully!']);
    }

    public function destroy(Product $product)
    {
        try {
            // Hapus semua gambar terkait produk
            foreach ($product->images as $image) {
                $filePath = str_replace('/storage/', '', $image->image_product_url);
                Storage::disk('public')->delete($filePath);

                $image->delete();
            }

            $product->delete();

            return redirect()->route('admin.product.index')
                ->with('success', 'Product deleted successfully');
        } catch (\Exception $e) {
            return redirect()->route('admin.product.index')
                ->with('error', 'Failed to delete product: ' . $e->getMessage());
        }
    }
}
