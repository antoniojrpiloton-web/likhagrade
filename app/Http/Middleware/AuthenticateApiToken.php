<?php

namespace App\Http\Middleware;

use App\Models\PersonalAccessToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if ($bearer) {
            $token = PersonalAccessToken::findToken($bearer);

            if (! $token || ($token->expires_at && $token->expires_at->isPast())) {
                return response()->json([
                    'message' => 'Invalid or expired API token.',
                ], 401);
            }

            $user = $token->tokenable;

            if (! $user) {
                return response()->json([
                    'message' => 'Unauthenticated user for token.',
                ], 401);
            }

            auth()->setUser($user);
            $token->forceFill(['last_used_at' => now()])->save();
        } elseif (! $request->user()) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return $next($request);
    }
}
