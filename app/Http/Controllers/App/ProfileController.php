<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function show(Request $request): Response
    {
        return Inertia::render('App/Profile', [
            'user' => [
                'id' => $request->user()->id,
                'first_name' => $request->user()->first_name,
                'last_name' => $request->user()->last_name,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'theme_preference' => $request->user()->theme_preference ?? 'light',
                'created_at' => $request->user()->created_at->format('M d, Y'),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'theme_preference' => ['required', 'string', 'in:light,dark,system'],
        ]);

        $old = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'theme_preference' => $user->theme_preference,
        ];

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => trim($validated['first_name'].' '.$validated['last_name']),
            'theme_preference' => $validated['theme_preference'],
        ]);

        $this->auditService->log(
            action: 'user.profile_updated',
            description: 'User updated profile information',
            subject: $user,
            oldValues: $old,
            newValues: $validated,
            user: $user
        );

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->auditService->log(
            action: 'user.password_changed',
            description: 'User changed password',
            subject: $user,
            user: $user
        );

        return back()->with('success', 'Password updated successfully.');
    }
}
