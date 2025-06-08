<?php

namespace App\Http\Controllers\Seller;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SellerDashboardController extends Controller
{
    public function index(){
        return Inertia::render('seller/dashboard');
    }
}
