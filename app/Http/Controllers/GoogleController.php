<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');

        $googleUser = $driver->stateless()->user();


        $user = User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'password' => bcrypt(Str::random(12)),
                'role' => 'customer',
            ]
        );

        Auth::login($user);

        return match ($user->role) {
            'admin' => redirect('/admin/dashboard'),
            'seller' => redirect('/seller/dashboard'),
            default => redirect('/customer/dashboard'),
        };
    }
}
