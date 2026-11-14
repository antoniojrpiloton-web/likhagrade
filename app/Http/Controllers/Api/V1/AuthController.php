<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->isSuspended()) {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

        $tokenResult = PersonalAccessToken::createTokenFor(
            $user,
            $validated['device_name'] ?? 'Mobile Scanner'
        );

        $tenants = $user->tenants()
            ->where('tenants.status', 'active')
            ->get(['tenants.id', 'tenants.ulid', 'tenants.name', 'tenants.type'])
            ->map(function ($t) use ($user) {
                return [
                    'id' => $t->id,
                    'ulid' => $t->ulid,
                    'name' => $t->name,
                    'type' => $t->type?->value ?? 'personal',
                    'role' => $user->roleInTenant($t),
                ];
            });

        $personal = $user->personalTenant();

        return response()->json([
            'token' => $tokenResult['plainTextToken'],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
            ],
            'active_workspace' => $personal ? [
                'id' => $personal->id,
                'ulid' => $personal->ulid,
                'name' => $personal->name,
                'type' => 'personal',
            ] : ($tenants->first() ?? null),
            'workspaces' => $tenants,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $bearer = $request->bearerToken();

        if ($bearer) {
            $token = PersonalAccessToken::findToken($bearer);
            if ($token) {
                $token->delete();
            }
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
