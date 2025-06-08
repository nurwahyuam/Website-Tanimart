<?php

use App\Http\Controllers\Admin\OrderController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Seller\SellerDashboardController;
use App\Http\Controllers\Customer\CustomerDashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/auth-google-redirect', [GoogleController::class, 'redirectToGoogle']);
Route::get('/auth-google-callback', [GoogleController::class, 'handleGoogleCallback']);

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.user.index');
    Route::post('/admin/users', [UserController::class, 'store'])->name('admin.user.store');
    Route::put('/admin/user/{user}/update', [UserController::class, 'update'])->name('admin.user.update');
    Route::delete('/admin/user/{user}', [UserController::class, 'destroy'])->name('admin.user.destroy');

    Route::get('admin/categories', [CategoryController::class, 'index'])->name('admin.category.index');
    Route::post('/admin/categories', [CategoryController::class, 'store'])->name('admin.category.store');
    Route::put('/admin/category/{category}/update', [CategoryController::class, 'update'])->name('admin.category.update');
    Route::delete('/admin/category/{category}', [CategoryController::class, 'destroy'])->name('admin.category.destroy');

    Route::get('admin/products', [ProductController::class, 'index'])->name('admin.product.index');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('admin.product.store');
    Route::put('/admin/product/{product}/update', [ProductController::class, 'update'])->name('admin.product.update');
    Route::delete('/admin/product/{product}', [ProductController::class, 'destroy'])->name('admin.product.destroy');

     Route::get('admin/orders', [OrderController::class, 'index'])->name('admin.order.index');
});

// Group untuk seller
Route::middleware(['auth', 'role:seller'])->group(function () {
    Route::get('/seller/dashboard', [SellerDashboardController::class, 'index'])->name('seller.dashboard');
});

// Group untuk customer
Route::middleware(['auth', 'role:customer'])->group(function () {
    Route::get('/customer/dashboard', [CustomerDashboardController::class, 'index'])->name('customer.dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
