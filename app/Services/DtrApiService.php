<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DtrApiService
{
    protected string $baseUrl;
    protected string $token;
    protected int $timeout;

    public function __construct(string $baseUrl, string $token, int $timeout = 10)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->token = $token;
        $this->timeout = $timeout;
    }

    /**
     * Search for employees by name or email
     *
     * @param string $searchTerm
     * @return array
     */
    public function searchEmployees(string $searchTerm): array
    {
        try {
            $response = $this->makeRequest('/api/employees', [
                'search' => $searchTerm
            ]);

            return $response['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('DTR API: Employee search failed', [
                'search_term' => $searchTerm,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get employee by ID
     *
     * @param int $employeeId
     * @return array|null
     */
    public function getEmployeeById(int $employeeId): ?array
    {
        try {
            $response = $this->makeRequest("/api/employees/{$employeeId}");

            return $response['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('DTR API: Get employee by ID failed', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Make HTTP request to DTR API
     *
     * @param string $endpoint
     * @param array $params
     * @return array
     * @throws \Exception
     */
    protected function makeRequest(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . $endpoint;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/json',
        ])
        ->timeout($this->timeout)
        ->get($url, $params);

        if ($response->successful()) {
            return $response->json();
        }

        if ($response->status() === 404) {
            return ['data' => []];
        }

        if (in_array($response->status(), [401, 403])) {
            Log::error('DTR API: Authentication failed', [
                'status' => $response->status(),
                'endpoint' => $endpoint
            ]);
            throw new \Exception('DTR API authentication failed');
        }

        throw new \Exception('DTR API request failed: ' . $response->status());
    }
}
