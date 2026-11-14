<?php

namespace Tests\Feature\Auth;

use App\Actions\Auth\RegisterUserAction;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_teachers_can_authenticate_using_the_login_screen(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $user = $registerAction->execute([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'teacher.login@gmail.com',
            'password' => 'Password123!',
        ]);

        $response = $this->post('/login', [
            'email' => 'teacher.login@gmail.com',
            'password' => 'Password123!',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('app.dashboard'));
    }

    public function test_users_cannot_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'WrongPassword',
        ]);

        $this->assertGuest();
    }

    public function test_suspended_users_are_rejected_at_login(): void
    {
        $user = User::factory()->suspended()->create([
            'email' => 'suspended@example.com',
            'password' => 'Password123!',
        ]);

        $response = $this->post('/login', [
            'email' => 'suspended@example.com',
            'password' => 'Password123!',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['email']);
    }

    public function test_authenticated_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }

    public function test_authenticated_users_can_logout_via_get_request(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }
}
