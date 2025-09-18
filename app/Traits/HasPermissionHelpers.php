<?php

namespace App\Traits;

trait HasPermissionHelpers
{
    /**
     * Check if authenticated user has permission
     */
    protected function checkPermission(string $permission): void
    {
        if (!auth()->user()?->can($permission)) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }

    /**
     * Check if authenticated user has role
     */
    protected function checkRole(string $role): void
    {
        if (!auth()->user()?->hasRole($role)) {
            abort(403, 'You do not have the required role to perform this action.');
        }
    }

    /**
     * Check if authenticated user has any of the given roles
     */
    protected function checkAnyRole(array $roles): void
    {
        if (!auth()->user()?->hasAnyRole($roles)) {
            abort(403, 'You do not have any of the required roles.');
        }
    }
}
