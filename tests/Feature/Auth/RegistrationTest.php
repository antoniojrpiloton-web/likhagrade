<?php

namespace Tests\Feature\Auth;

use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_teachers_can_register_with_any_valid_email_domain(): void
    {
        $response = $this->post('/register', [
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'teacher.maria@yahoo.com', // Non-institutional personal email
            'password' => 'TeacherSecurePass123!',
            'password_confirmation' => 'TeacherSecurePass123!',
            'terms' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('verification.notice'));

        // Assert user account was created
        $user = User::where('email', 'teacher.maria@yahoo.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Maria Santos', $user->name);
        $this->assertEquals('Maria', $user->first_name);
        $this->assertEquals('Santos', $user->last_name);

        // Assert personal workspace was automatically created
        $tenant = Tenant::where('owner_id', $user->id)->first();
        $this->assertNotNull($tenant);
        $this->assertEquals('Maria Santos Workspace', $tenant->name);
        $this->assertEquals(TenantType::Personal, $tenant->type);
        $this->assertEquals(TenantStatus::Active, $tenant->status);

        // Assert membership pivot record
        $this->assertTrue($tenant->hasMember($user));
        $this->assertEquals(TenantRole::Admin->value, $user->roleInTenant($tenant));
    }

    public function test_duplicate_email_registration_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'existing.teacher@gmail.com',
        ]);

        $response = $this->post('/register', [
            'first_name' => 'Another',
            'last_name' => 'Teacher',
            'email' => 'existing.teacher@gmail.com',
            'password' => 'Pass12345!',
            'password_confirmation' => 'Pass12345!',
            'terms' => true,
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }

    public function test_registration_fails_without_terms_acceptance(): void
    {
        $response = $this->post('/register', [
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria.santos@gmail.com',
            'password' => 'TeacherSecurePass123!',
            'password_confirmation' => 'TeacherSecurePass123!',
            'terms' => false,
        ]);

        $response->assertSessionHasErrors(['terms']);
        $this->assertGuest();
    }
}
