<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('created_at', 'desc')->paginate(6);

        return Inertia::render("admin/category", [
            "categories" => $categories,
            'role' => Auth::user()->role,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'active' => 'required|string',
        ]);

        Category::create($validated);

        return redirect()->route('admin.category.index')->with(['success' => 'Category created successfully.']);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'active' => 'required|string',
        ]);

        $category->name = $request->name;
        $category->active = $request->active;
        $category->save();

        return redirect()->route('admin.category.index')->with(['success' => 'User updated successfully!']);
    }

    public function destroy(Category $category)
    {
        if ($category->active === 'true') {
            return redirect()->route('admin.category.index')->with(['error' => 'Cannot Delete True Category!']);
        }

        $category->delete();


        return redirect()->route('admin.category.index')->with(['success' => 'User deleted successfully.']);
    }
}
