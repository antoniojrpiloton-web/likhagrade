<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Extend tenants table with organizational profile fields
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('org_type', 100)->nullable()->after('type'); // University, College, DepEd, Private School, etc.
            $table->string('contact_person', 100)->nullable()->after('org_type');
            $table->string('contact_email', 190)->nullable()->after('contact_person');
            $table->string('contact_number', 50)->nullable()->after('contact_email');
            $table->text('address')->nullable()->after('contact_number');
            $table->string('logo_url')->nullable()->after('address');
            $table->boolean('is_verified_institution')->default(false)->after('logo_url');
            $table->string('verification_status', 50)->default('pending')->after('is_verified_institution'); // pending, verified, rejected
        });

        // 2. Organization Departments (e.g. College of Computing, College of Engineering)
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 191);
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('head_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'name']);
        });

        // 3. Department User assignments (Teacher belonging to one or more departments)
        Schema::create('department_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 50)->default('Teacher'); // Department Admin, Teacher, Instructor
            $table->timestamps();

            $table->unique(['department_id', 'user_id']);
        });

        // 4. Subscriptions belong to Tenants (Individual teacher workspace or Institutional organization)
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();
            $table->string('plan_name', 100)->default('Free Tier');
            $table->string('billing_cycle', 50)->default('free'); // free, monthly, yearly
            $table->string('status', 50)->default('active'); // active, trialing, past_due, canceled
            $table->integer('scans_limit')->default(100);
            $table->integer('scans_used')->default(0);
            $table->integer('exams_limit')->default(10);
            $table->integer('exams_used')->default(0);
            $table->integer('members_limit')->default(1);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        // 5. Tenant Invitations for inviting Teachers/Instructors
        Schema::create('tenant_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('email', 190)->index();
            $table->string('role', 50)->default('Teacher');
            $table->string('token', 64)->unique();
            $table->foreignId('invited_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 50)->default('pending'); // pending, accepted, declined, expired
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_invitations');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('department_user');
        Schema::dropIfExists('departments');

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'org_type',
                'contact_person',
                'contact_email',
                'contact_number',
                'address',
                'logo_url',
                'is_verified_institution',
                'verification_status',
            ]);
        });
    }
};
