<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SyncEmployeesController extends Controller
{
    public function __invoke(Request $request)
    {
        $token = $request->bearerToken();
        $expectedToken = config('sync.api_token');

        if (!$token || !$expectedToken || $token !== $expectedToken) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'employees' => 'required|array',
            'employees.*.id' => 'required|integer',
            'employees.*.name' => 'required|string',
            'employees.*.email' => 'nullable|string',
            'employees.*.department' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid payload',
                'details' => $validator->errors()
            ], 422);
        }

        foreach ($request->input('employees') as $employeeData) {
            Employee::updateOrCreate(
                ['dtr_id' => $employeeData['id']],
                [
                    'full_name' => $employeeData['name'],
                    'email' => $employeeData['email'] ?? null,
                    'department' => $employeeData['department'] ?? null,
                    'is_active' => true,
                    'last_synced_at' => now(),
                ]
            );
        }

        return response()->json(['status' => 'ok']);
    }
}
