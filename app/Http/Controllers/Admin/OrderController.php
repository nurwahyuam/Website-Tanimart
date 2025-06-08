<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Order;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');

        $orders = Order::with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $orders->where(function ($query) use ($search) {
                $query->whereHas('customer', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($status) {
            $orders->where('status', $status);
        }

        if ($minPrice) {
            $orders->where('total_price', '>=', $minPrice);
        }

        if ($maxPrice) {
            $orders->where('total_price', '<=', $maxPrice);
        }

        $orders = $orders->paginate(4)
            ->appends([
                'search' => $search,
                'status' => $status,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
            ]);

        return Inertia::render('admin/order', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'min-price', 'max-price']),
            'role' => Auth::user()->role,
            'id' => Auth::user()->id,
        ]);
    }
}
