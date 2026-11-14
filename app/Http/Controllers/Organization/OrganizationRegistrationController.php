<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\RegisterOrganizationAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Organization/Register');
    }

    public function store(Request $request, RegisterOrganizationAction $registerOrgAction): RedirectResponse
    {
        $currentUser = $request->user();

        $rules = [
            'org_name' => ['required', 'string', 'max:190'],
            'org_type' => ['required', 'string', 'in:University,College,High School,Elementary School,DepEd Division,Private Institution,Training Center,Other'],
            'contact_person' => ['required', 'string', 'max:100'],
            'contact_email' => ['required', 'email', 'max:190'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ];

        if (! $currentUser) {
            $rules['first_name'] = ['required', 'string', 'max:100'];
            $rules['last_name'] = ['required', 'string', 'max:100'];
            $rules['email'] = ['required', 'email', 'max:190', 'unique:users,email'];
            $rules['password'] = ['required', 'confirmed', Password::defaults()];
            $rules['terms'] = ['accepted', 'required'];
        }

        $validated = $request->validate($rules);

        $result = $registerOrgAction->execute($validated, $currentUser);

        if (! $currentUser) {
            Auth::login($result['user']);
        }

        $request->session()->put('active_tenant_id', $result['tenant']->id);

        return redirect()->route('app.dashboard')->with('success', "Welcome to your new institutional workspace: {$result['tenant']->name}");
    }
}
