<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_create_standalone_class_without_subject_or_section(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Gabriel',
            'last_name' => 'Mendoza',
            'email' => 'gabriel.mendoza@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.classes.store'), [
                'name' => 'Ad-Hoc Review Session',
                'code' => 'REV-01',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $class = SchoolClass::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($class);
        $this->assertEquals('Ad-Hoc Review Session', $class->name);
        $this->assertNull($class->subject_id);
        $this->assertNull($class->section_id);
        $this->assertNull($class->academic_period_id);
        $this->assertEquals($teacher->id, $class->teacher_id);
    }

    public function test_teacher_can_create_organized_class_with_optional_relations(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Hannah',
            'last_name' => 'Bautista',
            'email' => 'hannah.bautista@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $subject = Subject::create([
            'tenant_id' => $workspace->id,
            'name' => 'Physics',
            'code' => 'PHYS101',
            'is_archived' => false,
        ]);

        $section = Section::create([
            'tenant_id' => $workspace->id,
            'name' => 'Grade 12 - Einstein',
            'code' => 'G12-EIN',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.classes.store'), [
                'name' => 'Physics 101 - Einstein',
                'code' => 'PHYS-EIN',
                'subject_id' => $subject->id,
                'section_id' => $section->id,
                'schedule' => 'TTh 1:00 PM - 2:30 PM',
                'room' => 'Lab 1',
            ]);

        $response->assertSessionHasNoErrors();

        $class = SchoolClass::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($class);
        $this->assertEquals('Physics 101 - Einstein', $class->name);
        $this->assertEquals($subject->id, $class->subject_id);
        $this->assertEquals($section->id, $class->section_id);
    }

    public function test_teacher_can_enroll_and_remove_students_from_class(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Irene',
            'last_name' => 'Navarro',
            'email' => 'irene.navarro@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $class = SchoolClass::create([
            'tenant_id' => $workspace->id,
            'name' => 'Biology 1',
            'is_archived' => false,
        ]);

        $student = Student::create([
            'tenant_id' => $workspace->id,
            'student_id' => '2026-0001',
            'first_name' => 'Mark',
            'last_name' => 'Villanueva',
            'is_archived' => false,
        ]);

        $enrollResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.classes.enroll', $class->id), [
                'student_id' => $student->id,
            ]);

        $enrollResponse->assertSessionHasNoErrors();

        $this->assertEquals(1, $class->students()->count());
        $this->assertTrue($class->students->contains($student));

        $removeResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->delete(route('app.classes.remove-student', [$class->id, $student->id]));

        $removeResponse->assertSessionHasNoErrors();
        $this->assertEquals(0, $class->students()->count());
        $this->assertDatabaseHas('students', ['id' => $student->id]);
    }

    public function test_cross_tenant_class_isolation(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacherA = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'A',
            'email' => 'ta@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherA->markEmailAsVerified();

        $teacherB = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'B',
            'email' => 'tb@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherB->markEmailAsVerified();

        $workspaceA = $teacherA->personalTenant();
        $workspaceB = $teacherB->personalTenant();

        $classA = SchoolClass::create([
            'tenant_id' => $workspaceA->id,
            'name' => 'Class A',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->get(route('app.classes.show', $classA->id));

        $response->assertForbidden();
    }
}
