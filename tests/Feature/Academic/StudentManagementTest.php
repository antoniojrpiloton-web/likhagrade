<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\SchoolClass;
use App\Models\Student;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class StudentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_register_student_with_unique_id(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Jose',
            'last_name' => 'Rizal',
            'email' => 'jose.rizal@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.students.store'), [
                'student_id' => '2026-00100',
                'first_name' => 'Crisostomo',
                'last_name' => 'Ibarra',
                'email' => 'ibarra@san-diego.edu',
                'gender' => 'Male',
            ]);

        $response->assertSessionHasNoErrors();

        $student = Student::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($student);
        $this->assertEquals('2026-00100', $student->student_id);
        $this->assertEquals('Crisostomo Ibarra', $student->full_name);
        $this->assertFalse($student->is_archived);
    }

    public function test_student_id_is_auto_generated_when_omitted(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Maria',
            'last_name' => 'Clara',
            'email' => 'clara@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.students.store'), [
                'first_name' => 'Basilio',
                'last_name' => 'Sisa',
            ]);

        $response->assertSessionHasNoErrors();

        $student = Student::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($student);
        $this->assertNotEmpty($student->student_id);
        $this->assertStringStartsWith('STD-'.date('Y').'-', $student->student_id);
        $this->assertEquals('Basilio Sisa', $student->full_name);
    }

    public function test_duplicate_student_id_in_same_workspace_is_rejected(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Andres',
            'last_name' => 'Bonifacio',
            'email' => 'andres@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        Student::create([
            'tenant_id' => $workspace->id,
            'student_id' => '2026-DUP',
            'first_name' => 'Student',
            'last_name' => 'One',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.students.store'), [
                'student_id' => '2026-DUP',
                'first_name' => 'Student',
                'last_name' => 'Two',
            ]);

        $response->assertSessionHasErrors(['student_id']);
        $this->assertEquals(1, Student::where('tenant_id', $workspace->id)->where('student_id', '2026-DUP')->count());
    }

    public function test_same_student_id_is_allowed_across_different_workspaces(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacherA = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Alpha',
            'email' => 'talpha@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherA->markEmailAsVerified();

        $teacherB = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Beta',
            'email' => 'tbeta@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherB->markEmailAsVerified();

        $workspaceA = $teacherA->personalTenant();
        $workspaceB = $teacherB->personalTenant();

        Student::create([
            'tenant_id' => $workspaceA->id,
            'student_id' => 'SHARED-ID-123',
            'first_name' => 'Student',
            'last_name' => 'Alpha',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->post(route('app.students.store'), [
                'student_id' => 'SHARED-ID-123',
                'first_name' => 'Student',
                'last_name' => 'Beta',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('students', [
            'tenant_id' => $workspaceA->id,
            'student_id' => 'SHARED-ID-123',
            'first_name' => 'Student',
        ]);
        $this->assertDatabaseHas('students', [
            'tenant_id' => $workspaceB->id,
            'student_id' => 'SHARED-ID-123',
            'first_name' => 'Student',
        ]);
    }

    public function test_csv_import_preview_and_confirm_workflow(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Emilio',
            'last_name' => 'Aguinaldo',
            'email' => 'emilio@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $class = SchoolClass::create([
            'tenant_id' => $workspace->id,
            'name' => 'History 101',
            'is_archived' => false,
        ]);

        $csvContent = "student_id,first_name,last_name,email,gender\n".
            "2026-101,Clara,Santos,clara@school.edu,Female\n".
            "2026-102,Mateo,Reyes,mateo@school.edu,Male\n".
            "2026-101,Duplicate,Row,dup@school.edu,Female\n".
            ",Incomplete,,none@school.edu,Male\n";

        $file = UploadedFile::fake()->createWithContent('students.csv', $csvContent);

        $previewResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.students.import.preview'), [
                'file' => $file,
            ]);

        $previewResponse->assertOk();
        $previewResponse->assertJsonStructure([
            'total_rows',
            'valid_count',
            'rows',
        ]);

        $previewData = $previewResponse->json();
        $this->assertEquals(4, $previewData['total_rows']);
        $this->assertEquals(2, $previewData['valid_count']);

        $confirmResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.students.import.confirm'), [
                'class_id' => $class->id,
                'rows' => [
                    [
                        'student_id' => '2026-101',
                        'first_name' => 'Clara',
                        'last_name' => 'Santos',
                        'email' => 'clara@school.edu',
                        'gender' => 'Female',
                    ],
                    [
                        'student_id' => '2026-102',
                        'first_name' => 'Mateo',
                        'last_name' => 'Reyes',
                        'email' => 'mateo@school.edu',
                        'gender' => 'Male',
                    ],
                ],
            ]);

        $confirmResponse->assertSessionHasNoErrors();
        $this->assertEquals(2, Student::where('tenant_id', $workspace->id)->count());
        $this->assertEquals(2, $class->students()->count());
    }
}
