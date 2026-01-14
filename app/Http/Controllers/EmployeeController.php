<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Services\EmployeeSearchService;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    protected EmployeeSearchService $searchService;

    public function __construct(EmployeeSearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    public function search(Request $request)
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
            // Use the new fuzzy search service (limit to top 3 matches)
            $employees = $this->searchService->search($query, 3);

            // Format response to match expected structure
            $formattedEmployees = $employees->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'dtr_id' => $employee->dtr_id,
                    'full_name' => $employee->full_name,
                    'email' => $employee->email,
                    'department' => $employee->department,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedEmployees
            ]);
        } catch (\Exception $e) {
            \Log::error('Employee search error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to search employees',
                'data' => []
            ], 500);
        }
    }
}
