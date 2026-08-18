<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register
     * Creates a new tenant + admin user in one step.
     * No auth required — this is the onboarding endpoint.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_name'       => 'required|string|max:255',
            'tenant_slug'       => 'required|string|max:100|unique:tenants,slug|regex:/^[a-z0-9-]+$/',
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users,email',
            'password'          => ['required', 'confirmed', Password::min(8)],
            'phone'             => 'nullable|string|max:20',
        ]);

        $tenant = Tenant::create([
            'name'             => $request->tenant_name,
            'slug'             => $request->tenant_slug,
            'subscription_tier' => 'starter',
            'features_enabled' => [],
            'trial_ends_at'    => now()->addDays(14),
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => User::ROLE_ADMIN,
            'phone'     => $request->phone,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'user'   => $user->only('id', 'name', 'email', 'role', 'phone'),
            'tenant' => $tenant->only('id', 'name', 'slug', 'subscription_tier', 'trial_ends_at'),
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('tenant')
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json(['error' => 'Account is deactivated.'], 403);
        }

        if ($user->tenant && ! $user->tenant->is_active) {
            return response()->json(['error' => 'Tenant account is suspended.'], 403);
        }

        // Revoke old tokens, issue fresh one
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'token'  => $token,
            'user'   => $user->only('id', 'name', 'email', 'role', 'phone', 'avatar_url'),
            'tenant' => $user->tenant?->only('id', 'name', 'slug', 'logo_url', 'primary_color', 'subscription_tier', 'features_enabled'),
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('tenant');

        return response()->json([
            'user'   => $user->only('id', 'name', 'email', 'role', 'phone', 'avatar_url', 'last_login_at'),
            'tenant' => $user->tenant?->only('id', 'name', 'slug', 'logo_url', 'primary_color', 'subscription_tier', 'features_enabled', 'trial_ends_at'),
        ]);
    }

    /**
     * POST /api/v1/auth/refresh
     * Revoke current token and issue a new one.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['token' => $token]);
    }

    /**
     * GET /api/v1/staff
     * Admin/Manager — list all staff for this tenant.
     */
    public function listStaff(Request $request): JsonResponse
    {
        $staff = User::where('tenant_id', $request->user()->tenant_id)
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'phone', 'is_active', 'last_login_at', 'created_at']);

        return response()->json(['staff' => $staff, 'count' => $staff->count()]);
    }

    /**
     * POST /api/v1/staff
     * Admin — invite/create a staff member.
     */
    public function inviteStaff(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'role'     => 'required|in:manager,waiter,kitchen,cashier',
            'phone'    => 'nullable|string|max:20',
            'password' => ['required', Password::min(8)],
        ]);

        $user = User::create([
            'tenant_id' => $request->user()->tenant_id,
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role,
            'phone'     => $request->phone,
        ]);

        return response()->json($user->only('id', 'name', 'email', 'role', 'phone'), 201);
    }

    /**
     * PUT /api/v1/staff/{id}
     * Admin — update staff details.
     */
    public function updateStaff(Request $request, string $id): JsonResponse
    {
        $user = User::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
            'password'  => ['sometimes', Password::min(8)],
        ]);

        $data = $request->only(['name', 'phone', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($user->only('id', 'name', 'email', 'role', 'phone', 'is_active'));
    }

    /**
     * DELETE /api/v1/staff/{id}
     * Admin — remove a staff member.
     */
    public function removeStaff(Request $request, string $id): JsonResponse
    {
        $user = User::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        // Cannot delete yourself
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Staff member removed.']);
    }

    /**
     * PATCH /api/v1/staff/{id}/role
     * Admin — change a staff member's role.
     */
    public function changeRole(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:manager,waiter,kitchen,cashier',
        ]);

        $user = User::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot change your own role.'], 422);
        }

        $user->update(['role' => $request->role]);

        return response()->json(['id' => $user->id, 'role' => $user->role]);
    }
}
