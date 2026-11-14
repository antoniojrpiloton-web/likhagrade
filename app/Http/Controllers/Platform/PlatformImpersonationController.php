<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlatformImpersonationController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function impersonate(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'You are already logged in as this user.');
        }

        if ($user->isSuperAdmin()) {
            return back()->with('error', 'Cannot impersonate another SuperAdmin account.');
        }

        $request->session()->put('impersonator_id', $currentUser->id);
        $request->session()->put('impersonator_name', $currentUser->name);

        $this->auditService->log(
            action: 'platform.impersonation_started',
            description: "SuperAdmin {$currentUser->email} started impersonating {$user->email}",
            subject: $user,
            user: $currentUser
        );

        Auth::login($user);
        $request->session()->forget('active_tenant_id');

        return redirect()->route('app.dashboard')->with('info', "Now impersonating {$user->name}.");
    }

    public function leave(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->get('impersonator_id');

        if (! $impersonatorId) {
            return redirect()->route('platform.dashboard');
        }

        $superAdmin = User::find($impersonatorId);

        if (! $superAdmin || ! $superAdmin->isSuperAdmin()) {
            Auth::logout();
            $request->session()->invalidate();

            return redirect()->route('login');
        }

        $currentUser = $request->user();

        $request->session()->forget('impersonator_id');
        $request->session()->forget('impersonator_name');
        $request->session()->forget('active_tenant_id');

        Auth::login($superAdmin);

        $this->auditService->log(
            action: 'platform.impersonation_ended',
            description: "SuperAdmin {$superAdmin->email} ended impersonation of {$currentUser?->email}",
            subject: $currentUser,
            user: $superAdmin
        );

        return redirect()->route('platform.users')->with('success', 'Returned to SuperAdmin session.');
    }
}
