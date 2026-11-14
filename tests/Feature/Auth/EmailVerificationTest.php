<?php

namespace Tests\Feature\Auth;

use App\Actions\Auth\RegisterUserAction;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/email/verify');

        $response->assertStatus(200);
    }

    public function test_email_can_be_verified(): void
    {
        Event::fake();

        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('app.dashboard').'?verified=1');
    }

    public function test_unverified_user_cannot_access_protected_tenant_dashboard(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $user = $registerAction->execute([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'unverified@example.com',
            'password' => 'Pass12345!',
        ]);

        // Ensure user email is unverified
        $user->forceFill(['email_verified_at' => null])->save();

        $response = $this->actingAs($user)->get('/app/dashboard');

        $response->assertRedirect(route('verification.notice'));
    }
}
