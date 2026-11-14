<?php

namespace App\DataTables;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

abstract class BaseDataTable
{
    abstract public function query(): Builder;

    abstract public function columns(): array;

    public function allowedSortColumns(): array
    {
        return array_values(array_filter(array_map(function ($col) {
            return ($col['orderable'] ?? true) ? ($col['data'] ?? null) : null;
        }, $this->columns())));
    }

    public function allowedSearchColumns(): array
    {
        return array_values(array_filter(array_map(function ($col) {
            return ($col['searchable'] ?? true) ? ($col['data'] ?? null) : null;
        }, $this->columns())));
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('start_date')) {
            $query->whereDate($query->getModel()->getTable().'.created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate($query->getModel()->getTable().'.created_at', '<=', $request->input('end_date'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where($query->getModel()->getTable().'.status', $request->input('status'));
        }

        return $query;
    }

    public function render(Request $request): JsonResponse
    {
        $query = $this->query();
        $query = $this->applyFilters($query, $request);

        $dataTable = DataTables::eloquent($query);

        $searchValue = $request->input('search.value');
        if (! empty($searchValue) && empty($request->input('columns'))) {
            $searchCols = $this->allowedSearchColumns();
            $dataTable->filter(function ($q) use ($searchValue, $searchCols) {
                $q->where(function ($sub) use ($searchValue, $searchCols) {
                    foreach ($searchCols as $col) {
                        $sub->orWhere($col, 'like', "%{$searchValue}%");
                    }
                });
            });
        }

        $this->customizeDataTable($dataTable);

        return $dataTable->toJson();
    }

    protected function customizeDataTable($dataTable): void {}
}
