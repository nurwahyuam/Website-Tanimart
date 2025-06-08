<?php

namespace App\Http\Controllers\Customer;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CustomerDashboardController extends Controller
{
    public function index(){
        return Inertia::render('customer/dashboard');
    }
}
