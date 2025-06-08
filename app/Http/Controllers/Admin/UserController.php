<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->paginate(6);

        return Inertia::render('admin/user', [
            'users' => $users,
            'role' => Auth::user()->role,
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string',
            'no_phone' => 'nullable|string|max:20',
            'profile_photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('profile_photo')) {
            $photo = $request->file('profile_photo')->store('profile_photos', 'public');
            $validated['profile_photo'] = basename($photo);
        }

        $validated['password'] = bcrypt($validated['password']); // enkripsi password!

        User::create($validated);

        return redirect()->route('admin.user.index')->with(['success' => 'User created successfully.']);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|string',
            'no_phone' => 'required|string',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo && Storage::disk('public')->exists('profile_photos/' . $user->profile_photo)) {
                Storage::disk('public')->delete('profile_photos/' . $user->profile_photo);
            }

            $photo = $request->file('profile_photo')->store('profile_photos', 'public');
            $user->profile_photo = basename($photo);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->no_phone = $request->no_phone;

        if ($request->password) {
            $user->password = bcrypt($request->password);
        }

        $user->save();

        return redirect()->route('admin.user.index')->with(['success' => 'User updated successfully!']);
    }

    public function destroy(User $user)
    {
        if ($user->role === 'admin') {
            return redirect()->route('admin.user.index')->with(['error' => 'Cannot delete admin user.']);
        }

        $user->delete();


         return redirect()->route('admin.user.index')->with(['success' => 'User deleted successfully.']);
    }
}
