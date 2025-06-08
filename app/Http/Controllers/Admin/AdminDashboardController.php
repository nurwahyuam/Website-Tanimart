<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Mengirim data role melalui Inertia
        return Inertia::render('admin/dashboard', [
            'role' => Auth::user()->role,
        ]);
    }
}
