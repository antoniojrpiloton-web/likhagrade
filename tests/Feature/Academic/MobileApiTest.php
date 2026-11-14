<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\SchoolClass;
use App\Models\Student;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_mobile_login_returns_token_and_workspaces(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Mobile',
            'last_name' => 'User',
            'email' => 'mobile@school.edu',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson(route('api.auth.login'), [
            'email' => 'mobile@school.edu',
            'password' => 'Password123!',
            'device_name' => 'React Native iOS Scanner',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email'],
            'active_workspace' => ['id', 'name', 'type'],
            'workspaces',
        ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $teacher->id,
            'name' => 'React Native iOS Scanner',
        ]);
    }

    public function test_mobile_api_endpoints_work_on_empty_workspace_without_academic_setup(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Empty',
            'last_name' => 'Teacher',
            'email' => 'empty@school.edu',
            'password' => 'Password123!',
        ]);

        $loginResponse = $this->postJson(route('api.auth.login'), [
            'email' => 'empty@school.edu',
            'password' => 'Password123!',
        ]);

        $token = $loginResponse->json('token');
        $workspaceId = $loginResponse->json('active_workspace.id');

        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $workspaceId,
        ];

        $wsResponse = $this->getJson(route('api.workspace.show'), $headers);
        $wsResponse->assertOk();
        $wsResponse->assertJsonPath('workspace.id', $workspaceId);
        $wsResponse->assertJsonPath('features.quick_scan_enabled', true);

        $classesResponse = $this->getJson(route('api.academic.classes'), $headers);
        $classesResponse->assertOk();
        $classesResponse->assertExactJson(['data' => []]);

        $subjectsResponse = $this->getJson(route('api.academic.subjects'), $headers);
        $subjectsResponse->assertOk();
        $subjectsResponse->assertExactJson(['data' => []]);

        $sectionsResponse = $this->getJson(route('api.academic.sections'), $headers);
        $sectionsResponse->assertOk();
        $sectionsResponse->assertExactJson(['data' => []]);

        $periodsResponse = $this->getJson(route('api.academic.periods'), $headers);
        $periodsResponse->assertOk();
        $periodsResponse->assertExactJson(['data' => []]);

        $studentsResponse = $this->getJson(route('api.academic.students'), $headers);
        $studentsResponse->assertOk();
        $studentsResponse->assertExactJson(['data' => []]);
    }

    public function test_mobile_api_returns_academic_records_when_present(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Active',
            'last_name' => 'Teacher',
            'email' => 'active@school.edu',
            'password' => 'Password123!',
        ]);

        $workspace = $teacher->personalTenant();

        $class = SchoolClass::create([
            'tenant_id' => $workspace->id,
            'name' => 'Chemistry 101',
            'code' => 'CHEM101',
            'is_archived' => false,
        ]);

        $student = Student::create([
            'tenant_id' => $workspace->id,
            'student_id' => 'MOB-001',
            'first_name' => 'Leo',
            'last_name' => 'Garcia',
            'is_archived' => false,
        ]);

        $loginResponse = $this->postJson(route('api.auth.login'), [
            'email' => 'active@school.edu',
            'password' => 'Password123!',
        ]);

        $token = $loginResponse->json('token');

        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Tenant-Id' => $workspace->id,
        ];

        $classesResponse = $this->getJson(route('api.academic.classes'), $headers);
        $classesResponse->assertOk();
        $this->assertCount(1, $classesResponse->json('data'));
        $this->assertEquals('Chemistry 101', $classesResponse->json('data.0.name'));

        $createStudentResponse = $this->postJson(route('api.academic.students.store'), [
            'student_id' => 'MOB-002',
            'first_name' => 'Sara',
            'last_name' => 'Lopez',
        ], $headers);

        $createStudentResponse->assertStatus(201);
        $this->assertEquals(2, Student::where('tenant_id', $workspace->id)->count());
    }
}
