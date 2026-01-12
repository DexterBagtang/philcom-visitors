<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
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
            $employees = Employee::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('full_name', 'like', '%' . $query . '%')
                      ->orWhere('email', 'like', '%' . $query . '%');
                })
                ->orderBy('full_name')
                ->limit(10)
                ->get(['id', 'dtr_id', 'full_name', 'email', 'department']);

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search employees',
                'data' => []
            ], 500);
        }
    }
}
