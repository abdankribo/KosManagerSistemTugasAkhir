<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Lodging;
use App\Renter;
use App\Room;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;

class LodgingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Lodgings/Index', [
            'filters' => Request::all('search', 'trashed'),
            'lodgings' => Lodging::orderBy('end_at', 'desc')
                ->filter(Request::only('search', 'trashed'))
                ->paginate()
                ->transform(function ($lodging) {
                    return [
                        'id' => $lodging->id,
                        'renter' => $lodging->renter,
                        'room' => $lodging->room,
                        'start_at' => $lodging->start_at ? $lodging->start_at->format('d F Y') : '-',
                        'end_at' => $lodging->end_at ? $lodging->end_at->format('d F Y') : '-',
                        'deleted_at' => $lodging->deleted_at,
                        'status' => $lodging->getStatus(),
                    ];
                }),
        ]);
    }

    public function create()
    {
        return Inertia::render('Lodgings/Create', [
            'rooms' => Room::available()->get(),
            'renters' => Renter::all(),
        ]);
    }

    public function store()
    {
        $data = Request::validate($this->validationRules());

        if ($this->hasOverlappingLodging($data['room_id'], $data['start_at'], $data['end_at'])) {
            return Redirect::back()->withErrors([
                'room_id' => 'Kamar sudah memiliki penginapan pada rentang tanggal tersebut.',
            ])->withInput();
        }

        Lodging::create($data);

        return Redirect::route('lodgings.index')->with('success', 'Data Penginapan berhasil ditambahkan.');
    }

    public function edit(Lodging $lodging)
    {
        return Inertia::render('Lodgings/Edit', [
            'lodging' => [
                'id' => $lodging->id,
                'renter' => $lodging->renter,
                'room' => $lodging->room,
                'start_at' => $lodging->start_at ? $lodging->start_at->format('Y-m-d') : '',
                'end_at' => $lodging->end_at ? $lodging->end_at->format('Y-m-d') : '',
                'deleted_at' => $lodging->deleted_at,
                'payments' => $lodging->payments->transform(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'item' => $payment->invoice->bill->name,
                        'amount' => $payment->amount,
                        'issued_at' => $payment->invoice->created_at->format('d F Y'),
                        'created_at' => $payment->created_at->format('d F Y'),
                        'deleted_at' => $payment->deleted_at,
                    ];
                }),
            ],
            'rooms' => Room::available()->orWhere('id', $lodging->room_id)->get(),
            'renters' => Renter::all(),
        ]);
    }

    public function update(Lodging $lodging)
    {
        $data = Request::validate($this->validationRules());

        if ($this->hasOverlappingLodging($data['room_id'], $data['start_at'], $data['end_at'], $lodging->id)) {
            return Redirect::back()->withErrors([
                'room_id' => 'Kamar sudah memiliki penginapan pada rentang tanggal tersebut.',
            ])->withInput();
        }

        $lodging->update($data);

        return Redirect::back()->with('success', 'Data Penginapan berhasil diperbarui.');
    }

    public function destroy(Lodging $lodging)
    {
        $lodging->delete();

        return Redirect::back()->with('success', 'Data Penginapan berhasil dihapus.');
    }

    public function restore(Lodging $lodging)
    {
        $lodging->restore();

        return Redirect::back()->with('success', 'Data Penginapan berhasil dipulihkan.');
    }

    private function validationRules()
    {
        return [
            'renter_id' => ['required', 'exists:renters,id'],
            'room_id' => ['required', 'exists:rooms,id'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
        ];
    }

    private function hasOverlappingLodging($roomId, $startAt, $endAt, $ignoreId = null)
    {
        $start = Carbon::parse($startAt);
        $end = Carbon::parse($endAt);

        return Lodging::query()
            ->where('room_id', $roomId)
            ->whereNull('deleted_at')
            ->when($ignoreId, function ($query) use ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            })
            ->whereNotNull('start_at')
            ->whereNotNull('end_at')
            ->where('start_at', '<=', $end)
            ->where('end_at', '>=', $start)
            ->exists();
    }
}
