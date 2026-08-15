<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     * Creates a new tenant + admin user in one step.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_name'  => 'required|string|max:255',
            'tenant_slug'  => 'required|string|max:100|unique:tenants,slug|regex:/^[a-z0-9-]+$/',
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:8|confirmed',
        ]);

        $tenant = Tenant::create([
            'name'             => $request->tenant_name,
            'slug'             => $request->tenant_slug,
            'features_enabled' => ['tier' => 'starter'],
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => 'admin',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'user'   => $user->only('id', 'name', 'email', 'role'),
            'tenant' => $tenant->only('id', 'name', 'slug'),
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('tenant')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Revoke old tokens to keep sessions clean
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'user'   => $user->only('id', 'name', 'email', 'role'),
            'tenant' => $user->tenant?->only('id', 'name', 'slug', 'logo_url', 'primary_color'),
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user'   => $request->user()->only('id', 'name', 'email', 'role'),
            'tenant' => $request->user()->tenant?->only('id', 'name', 'slug', 'logo_url', 'primary_color', 'features_enabled'),
        ]);
    }
}
