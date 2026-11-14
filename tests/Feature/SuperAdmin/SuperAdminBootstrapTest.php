<?php

namespace Tests\Feature\SuperAdmin;

use App\Actions\Auth\RegisterUserAction;
use App\Actions\SuperAdmin\BootstrapSuperAdminAction;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuperAdminBootstrapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_superadmin_can_be_bootstrapped_via_action(): void
    {
        $action = app(BootstrapSuperAdminAction::class);
        $result = $action->execute('dytech98@gmail.com', 'InitialSecretPass123!');

        $this->assertTrue($result['created']);
        $this->assertEquals('dytech98@gmail.com', $result['user']->email);
        $this->assertTrue($result['user']->hasVerifiedEmail());
        $this->assertTrue($result['user']->isSuperAdmin());
        $this->assertTrue(Hash::check('InitialSecretPass123!', $result['user']->password));
    }

    public function test_superadmin_bootstrap_is_idempotent_and_preserves_password(): void
    {
        $action = app(BootstrapSuperAdminAction::class);
        $result1 = $action->execute('dytech98@gmail.com', 'FirstPassword123!');
        $this->assertTrue($result1['created']);

        // Run second time with different password
        $result2 = $action->execute('dytech98@gmail.com', 'SecondPassword123!');
        $this->assertFalse($result2['created']);
        $this->assertNull($result2['password']);

        // User count remains 1 and original password is preserved
        $this->assertEquals(1, User::where('email', 'dytech98@gmail.com')->count());
        $this->assertTrue(Hash::check('FirstPassword123!', $result2['user']->fresh()->password));
        $this->assertFalse(Hash::check('SecondPassword123!', $result2['user']->fresh()->password));
    }

    public function test_superadmin_can_access_platform_administration_routes(): void
    {
        $action = app(BootstrapSuperAdminAction::class);
        $result = $action->execute('dytech98@gmail.com', 'Pass123!');
        $superAdmin = $result['user'];

        $response = $this->actingAs($superAdmin)->get('/platform/dashboard');
        $response->assertStatus(200);

        $response = $this->actingAs($superAdmin)->get('/platform/users');
        $response->assertStatus(200);

        $response = $this->actingAs($superAdmin)->get('/platform/tenants');
        $response->assertStatus(200);

        $response = $this->actingAs($superAdmin)->get('/platform/activity-logs');
        $response->assertStatus(200);

        $response = $this->actingAs($superAdmin)->get('/platform/settings');
        $response->assertStatus(200);
    }

    public function test_ordinary_teacher_is_forbidden_from_platform_administration(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'John',
            'last_name' => 'Teacher',
            'email' => 'john.teacher@gmail.com',
            'password' => 'Pass12345!',
        ]);
        $teacher->markEmailAsVerified();

        // Ordinary teacher attempts to access platform routes
        $response = $this->actingAs($teacher)->get('/platform/dashboard');
        $response->assertStatus(403);

        $response = $this->actingAs($teacher)->get('/platform/users');
        $response->assertStatus(403);

        $response = $this->actingAs($teacher)->get('/platform/tenants');
        $response->assertStatus(403);
    }

    public function test_guest_is_redirected_to_login_when_accessing_platform_routes(): void
    {
        $response = $this->get('/platform/dashboard');
        $response->assertRedirect('/login');
    }
}
