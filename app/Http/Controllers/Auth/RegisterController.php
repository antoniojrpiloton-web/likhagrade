<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\RegisterUserAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request, RegisterUserAction $registerAction): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'terms' => ['accepted', 'required'],
            'theme_preference' => ['nullable', 'string', 'in:light,dark,system'],
        ], [
            'terms.accepted' => 'You must accept the terms of service and privacy agreement to register.',
        ]);

        $user = $registerAction->execute($validated);

        Auth::login($user);

        $personalTenant = $user->personalTenant();
        if ($personalTenant) {
            $request->session()->put('active_tenant_id', $personalTenant->id);
        }

        return redirect()->route('verification.notice');
    }
}
