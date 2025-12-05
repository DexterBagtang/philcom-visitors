<?php

namespace App\Http\Controllers;

use App\Services\DtrApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DtrController extends Controller
{
    protected DtrApiService $dtrService;

    public function __construct(DtrApiService $dtrService)
    {
        $this->dtrService = $dtrService;
    }

    /**
     * Search for employees using DTR API
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchEmployees(Request $request)
    {
        $query = $request->input('q', '');

        if (empty($query)) {
            return response()->json([
                'success' => false,
                'message' => 'Search query is required',
                'data' => []
            ], 400);
        }

        try {
            $employees = $this->dtrService->searchEmployees($query);

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);
        } catch (\Exception $e) {
            Log::error('DTR API search failed', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to search employees. Please try again.',
                'data' => []
            ], 500);
        }
    }

    /**
     * Get employee by ID
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEmployee(Request $request, int $id)
    {
        try {
            $employee = $this->dtrService->getEmployeeById($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found',
                    'data' => null
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee
            ]);
        } catch (\Exception $e) {
            Log::error('DTR API get employee failed', [
                'employee_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employee. Please try again.',
                'data' => null
            ], 500);
        }
    }
}
