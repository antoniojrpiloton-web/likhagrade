<?php

namespace Database\Seeders;

use App\Actions\SuperAdmin\BootstrapSuperAdminAction;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(BootstrapSuperAdminAction $action): void
    {
        $action->execute();
    }
}
