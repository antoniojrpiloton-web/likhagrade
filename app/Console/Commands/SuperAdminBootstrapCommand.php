<?php

namespace App\Console\Commands;

use App\Actions\SuperAdmin\BootstrapSuperAdminAction;
use Illuminate\Console\Command;

class SuperAdminBootstrapCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'superadmin:bootstrap
                            {--email= : Custom SuperAdmin email}
                            {--password= : Custom SuperAdmin password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Idempotently initialize the SuperAdmin account and platform-wide role';

    /**
     * Execute the console command.
     */
    public function handle(BootstrapSuperAdminAction $action): int
    {
        $email = $this->option('email');
        $password = $this->option('password');

        $result = $action->execute($email, $password);

        if ($result['created']) {
            $this->info("SuperAdmin account created: {$result['user']->email}");
            if ($result['password']) {
                $this->warn("Temporary password generated: {$result['password']}");
                $this->warn('Please store this password securely!');
            } else {
                $this->info('SuperAdmin password set from environment/option.');
            }
        } else {
            $this->info("SuperAdmin account already exists: {$result['user']->email}. Preserved existing account and password.");
        }

        return self::SUCCESS;
    }
}
