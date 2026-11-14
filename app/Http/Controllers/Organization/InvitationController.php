<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\AcceptInvitationAction;
use App\Actions\Organization\InviteTeacherAction;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\TenantInvitation;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected InviteTeacherAction $inviteAction,
        protected AcceptInvitationAction $acceptAction
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        if (! $tenant || ! $tenant->isOrganization()) {
            abort(403, 'Invitations are only available for organization workspaces.');
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'role' => ['required', 'string', 'in:Organization Admin,Department Admin,Teacher,Instructor'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        $invitation = $this->inviteAction->execute(
            tenant: $tenant,
            inviter: $request->user(),
            email: $validated['email'],
            role: $validated['role'],
            departmentId: $validated['department_id'] ?? null
        );

        $inviteUrl = route('invitations.show', $invitation->token);

        return back()->with('success', "Invitation sent to {$invitation->email}. Link: {$inviteUrl}");
    }

    public function show(string $token): Response|RedirectResponse
    {
        $invitation = TenantInvitation::with(['tenant', 'department', 'inviter'])
            ->where('token', $token)
            ->firstOrFail();

        if ($invitation->hasExpired()) {
            return Inertia::render('Organization/InvitationExpired', [
                'tenant_name' => $invitation->tenant->name,
            ]);
        }

        if ($invitation->status === 'accepted') {
            return redirect()->route('login')->with('info', 'This invitation has already been accepted.');
        }

        $currentUser = Auth::user();

        return Inertia::render('Organization/AcceptInvitation', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'tenant_name' => $invitation->tenant->name,
                'org_type' => $invitation->tenant->org_type ?? 'Educational Institution',
                'department_name' => $invitation->department?->name,
                'inviter_name' => $invitation->inviter?->name,
                'expires_at' => $invitation->expires_at->toFormattedDateString(),
            ],
            'current_user' => $currentUser ? [
                'id' => $currentUser->id,
                'email' => $currentUser->email,
                'name' => $currentUser->name,
            ] : null,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = TenantInvitation::where('token', $token)->firstOrFail();

        $user = $request->user();

        if (! $user) {
            // New user registering via invitation
            $validated = $request->validate([
                'first_name' => ['required', 'string', 'max:100'],
                'last_name' => ['required', 'string', 'max:100'],
                'password' => ['required', 'confirmed', Password::defaults()],
                'terms' => ['accepted', 'required'],
            ]);

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => strtolower($invitation->email),
                'password' => Hash::make($validated['password']),
                'status' => UserStatus::Active,
                'email_verified_at' => now(), // Invitation link acts as verified email
            ]);

            Auth::login($user);
        }

        $this->acceptAction->execute($invitation, $user);

        return redirect()->route('app.dashboard')->with('success', "You have joined {$invitation->tenant->name} as {$invitation->role}!");
    }
}
