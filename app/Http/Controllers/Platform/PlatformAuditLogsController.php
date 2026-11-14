<?php

namespace App\Http\Controllers\Platform;

use App\DataTables\AuditLogsDataTable;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAuditLogsController extends Controller
{
    public function index(): Response
    {
        $usersList = User::select(['id', 'name', 'email'])
            ->orderBy('name')
            ->take(100)
            ->get();

        $tenantsList = Tenant::select(['id', 'name', 'type'])
            ->orderBy('name')
            ->take(100)
            ->get();

        return Inertia::render('Platform/ActivityLogs', [
            'users_list' => $usersList,
            'tenants_list' => $tenantsList,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $dataTable = new AuditLogsDataTable(null);

        return $dataTable->render($request);
    }
}
