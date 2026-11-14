<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view the user model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->isSuperAdmin() || $user->id === $model->id;
    }

    /**
     * Determine whether the user can update the user model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->isSuperAdmin() || $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the user model.
     */
    public function delete(User $user, User $model): bool
    {
        // Users cannot delete their own SuperAdmin account or delete without SuperAdmin rights
        if ($user->id === $model->id) {
            return false;
        }

        return $user->isSuperAdmin();
    }
}
