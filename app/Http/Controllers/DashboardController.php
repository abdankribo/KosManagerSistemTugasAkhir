<?php

namespace App\Http\Controllers;

use App\Lodging;
use App\Renter;
use App\Room;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $connection = config('database.default');
        $database = ['connected' => false, 'driver' => $connection, 'name' => config('database.connections.'.$connection.'.database')];

        try {
            DB::connection()->getPdo();
            $database['connected'] = true;
        } catch (\Throwable $e) {
            $database['connected'] = false;
        }

        return Inertia::render('Dashboard/Index', [
            'counts' => [
                'rooms' => Room::available()->count(),
                'renters' => Renter::count(),
                'lodgings' => Lodging::active()->count(),
            ],
            'database' => $database,
        ]);
    }
}