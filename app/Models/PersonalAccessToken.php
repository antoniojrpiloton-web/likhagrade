<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class PersonalAccessToken extends Model
{
    use HasFactory;

    protected $table = 'personal_access_tokens';

    protected $fillable = [
        'name',
        'token',
        'abilities',
        'last_used_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'json',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }

    public static function createTokenFor(Model $tokenable, string $name, array $abilities = ['*']): array
    {
        $plainTextToken = Str::random(40);

        $token = $tokenable->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken),
            'abilities' => $abilities,
        ]);

        return [
            'accessToken' => $token,
            'plainTextToken' => $token->id.'|'.$plainTextToken,
        ];
    }

    public static function findToken(string $token): ?static
    {
        if (str_contains($token, '|')) {
            [$id, $plain] = explode('|', $token, 2);
            $instance = static::find($id);

            if ($instance && hash_equals($instance->token, hash('sha256', $plain))) {
                return $instance;
            }

            return null;
        }

        return static::where('token', hash('sha256', $token))->first();
    }
}
