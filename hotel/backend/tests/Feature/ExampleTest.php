<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Smoke test — verifies the Laravel application boots and handles requests.
     * The backend is API-only; there is no web root.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // Hit an intentionally-invalid guest token — we expect 404, not 500.
        // A 404 proves Laravel bootstrapped correctly and routing works.
        $response = $this->getJson('/api/v1/guest/invalid-token-that-does-not-exist');

        $response->assertStatus(404);
    }
}
