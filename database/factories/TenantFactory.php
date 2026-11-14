<?php

namespace Database\Factories;

use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = fake()->company().' Workspace';

        return [
            'ulid' => (string) Str::ulid(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(100, 9999),
            'type' => TenantType::Personal,
            'owner_id' => User::factory(),
            'status' => TenantStatus::Active,
        ];
    }

    public function organization(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => TenantType::Organization,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TenantStatus::Suspended,
        ]);
    }
}
