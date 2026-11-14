<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Organization\AcceptInvitationAction;
use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Redirect to Google's OAuth consent screen.
     */
    public function redirect(Request $request): RedirectResponse
    {
        if ($request->has('invitation_token')) {
            $request->session()->put('google_oauth_invitation_token', $request->query('invitation_token'));
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect()->route('login')->with('error', 'Google authentication was cancelled or encountered an error. Please try again.');
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));
        if (empty($email)) {
            return redirect()->route('login')->with('error', 'Unable to retrieve your email address from Google.');
        }

        // Look for existing user by Google ID or Email
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        $isNewUser = false;

        if ($user) {
            if ($user->isSuspended()) {
                return redirect()->route('login')->with('error', 'Your account has been suspended. Please contact platform support.');
            }

            // Link Google ID if not yet linked
            if (empty($user->google_id)) {
                $user->google_id = $googleUser->getId();
            }

            // Google emails are verified
            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
            }

            // Update avatar if not set
            if (empty($user->avatar_url) && $googleUser->getAvatar()) {
                $user->avatar_url = $googleUser->getAvatar();
            }

            $user->save();
        } else {
            // New user registration via Google Sign-Up
            $isNewUser = true;

            $fullName = (string) $googleUser->getName();
            $nameParts = explode(' ', trim($fullName ?: 'Google User'), 2);

            $rawUser = $googleUser->user ?? [];
            $firstName = $rawUser['given_name'] ?? ($nameParts[0] ?: 'Teacher');
            $lastName = $rawUser['family_name'] ?? ($nameParts[1] ?? 'Instructor');

            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => trim($firstName.' '.$lastName),
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'status' => UserStatus::Active,
                'theme_preference' => 'light',
            ]);

            // Bootstrap isolated personal workspace for the newly registered teacher
            $workspaceName = trim($firstName.' '.$lastName).' Workspace';
            $tenant = Tenant::create([
                'name' => $workspaceName,
                'type' => TenantType::Personal,
                'owner_id' => $user->id,
                'status' => TenantStatus::Active,
            ]);

            $tenant->members()->attach($user->id, [
                'membership_role' => TenantRole::Admin->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            setPermissionsTeamId($tenant->id);
            $user->assignRole(TenantRole::Admin->value);

            // Default personal subscription
            $tenant->getOrCreateDefaultSubscription();
        }

        Auth::login($user, remember: true);

        // Check if an invitation token was attached to the OAuth flow
        $invToken = $request->session()->pull('google_oauth_invitation_token');
        if ($invToken) {
            $invitation = TenantInvitation::where('token', $invToken)
                ->where('status', 'pending')
                ->first();

            if ($invitation && ! $invitation->hasExpired()) {
                app(AcceptInvitationAction::class)->execute($invitation, $user);

                return redirect()->route('app.dashboard')
                    ->with('success', "Welcome to {$invitation->tenant->name}! You have joined as {$invitation->role}.");
            }
        }

        // Resolve active tenant
        $activeTenant = $user->personalTenant() ?? $user->tenants()->where('tenants.status', TenantStatus::Active)->first();
        if ($activeTenant) {
            $request->session()->put('active_tenant_id', $activeTenant->id);
        }

        $this->auditService->log(
            action: $isNewUser ? 'auth.google_signup' : 'auth.google_login',
            description: $isNewUser
                ? "User signed up with Google OAuth ({$user->email})"
                : "User authenticated with Google OAuth ({$user->email})",
            subject: $user,
            tenant: $activeTenant,
            user: $user,
        );

        $welcomeMessage = $isNewUser
            ? "Welcome to LikhaGrade, {$user->first_name}! Your personal workspace is ready."
            : "Welcome back, {$user->first_name}!";

        return redirect()->intended(route('app.dashboard'))->with('success', $welcomeMessage);
    }
}
