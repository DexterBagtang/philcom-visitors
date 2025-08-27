<?php

namespace App\Http\Controllers;

use App\Models\Host;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HostController
{
    public function index()
    {
        return Inertia::render('hosts/index', [
            'hosts' => Host::orderBy('created_at', 'desc')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('hosts/create', []);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:hosts,email|max:255',
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        $validated['active'] = $validated['active'] ?? true;
        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        Host::create($validated);

        return redirect()->back()->with('success', 'Host created successfully.');
    }

    public function edit(Host $host)
    {
        return Inertia::render('Hosts/Edit', [
            'host' => $host,
        ]);
    }

    public function update(Request $request, Host $host)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('hosts', 'email')->ignore($host->id),
            ],
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        $validated['updated_at'] = now();

        $host->update($validated);

        return redirect()->back()->with('success', 'Host updated successfully.');
    }

    public function destroy(Host $host)
    {
        $host->delete();

        return redirect()->route('hosts.index')->with('success', 'Host deleted successfully.');
    }
}
