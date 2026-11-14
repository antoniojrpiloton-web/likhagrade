<?php

namespace Tests\Feature\Auth;

use App\Actions\Organization\InviteTeacherAction;
use App\Actions\Organization\RegisterOrganizationAction;
use App\Enums\TenantRole;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_google_redirect_initiates_oauth_redirect(): void
    {
        $response = $this->get(route('auth.google'));

        $response->assertRedirect();
        $target = $response->getTargetUrl();
        $this->assertStringContainsString('accounts.google.com', $target);
    }

    public function test_new_user_can_sign_up_via_google_and_gets_personal_workspace(): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-unique-id-12345');
        $socialiteUser->shouldReceive('getEmail')->andReturn('teacher.google@gmail.com');
        $socialiteUser->shouldReceive('getName')->andReturn('Elena Rostova');
        $socialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/photo.jpg');
        $socialiteUser->user = [
            'given_name' => 'Elena',
            'family_name' => 'Rostova',
        ];

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('app.dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'teacher.google@gmail.com',
            'google_id' => 'google-unique-id-12345',
            'first_name' => 'Elena',
            'last_name' => 'Rostova',
        ]);

        $user = User::where('email', 'teacher.google@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertAuthenticatedAs($user);

        // Verify personal workspace was automatically created
        $personalTenant = $user->personalTenant();
        $this->assertNotNull($personalTenant);
        $this->assertEquals(TenantType::Personal, $personalTenant->type);
        $this->assertTrue($user->hasTenantRole($personalTenant, TenantRole::Admin));

        // Verify tenant-owned subscription exists
        $this->assertNotNull($personalTenant->subscription);
    }

    public function test_existing_user_can_sign_in_via_google_and_links_google_id(): void
    {
        $existingUser = User::factory()->create([
            'email' => 'existing.teacher@yahoo.com',
            'google_id' => null,
            'status' => UserStatus::Active,
        ]);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-link-id-999');
        $socialiteUser->shouldReceive('getEmail')->andReturn('existing.teacher@yahoo.com');
        $socialiteUser->shouldReceive('getName')->andReturn($existingUser->name);
        $socialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');
        $socialiteUser->user = [];

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('app.dashboard'));

        $existingUser->refresh();
        $this->assertEquals('google-link-id-999', $existingUser->google_id);
        $this->assertAuthenticatedAs($existingUser);
    }

    public function test_suspended_user_cannot_sign_in_via_google(): void
    {
        $suspendedUser = User::factory()->create([
            'email' => 'suspended.teacher@gmail.com',
            'google_id' => 'google-suspended-123',
            'status' => UserStatus::Suspended,
        ]);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-suspended-123');
        $socialiteUser->shouldReceive('getEmail')->andReturn('suspended.teacher@gmail.com');
        $socialiteUser->user = [];

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error');
        $this->assertGuest();
    }

    public function test_invited_teacher_accepts_invitation_via_google_oauth(): void
    {
        // 1. Set up organization & invitation
        $registerOrg = app(RegisterOrganizationAction::class);
        $orgResult = $registerOrg->execute([
            'org_name' => 'Surigao State College',
            'org_type' => 'College',
            'contact_person' => 'Dean Lead',
            'contact_email' => 'dean@ssc.edu.ph',
            'first_name' => 'Dean',
            'last_name' => 'Lead',
            'email' => 'dean.lead@ssc.edu.ph',
            'password' => 'Secret123!',
        ]);

        $admin = $orgResult['user'];
        $tenant = $orgResult['tenant'];

        $inviteAction = app(InviteTeacherAction::class);
        $invitation = $inviteAction->execute(
            tenant: $tenant,
            inviter: $admin,
            email: 'invited.google@gmail.com',
            role: 'Teacher'
        );

        // 2. Google OAuth with invitation_token in session
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-inv-token-id-555');
        $socialiteUser->shouldReceive('getEmail')->andReturn('invited.google@gmail.com');
        $socialiteUser->shouldReceive('getName')->andReturn('Grace Hopper');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);
        $socialiteUser->user = ['given_name' => 'Grace', 'family_name' => 'Hopper'];

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->withSession(['google_oauth_invitation_token' => $invitation->token])
            ->get(route('auth.google.callback'));

        $response->assertRedirect(route('app.dashboard'));

        $teacher = User::where('email', 'invited.google@gmail.com')->first();
        $this->assertNotNull($teacher);
        $this->assertTrue($tenant->hasMember($teacher));
        $this->assertTrue($teacher->hasTenantRole($tenant, TenantRole::Teacher));
    }
}
