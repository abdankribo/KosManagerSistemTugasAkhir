<?php

namespace App;

use CarbonCarbon;
use IlluminateDatabaseEloquentSoftDeletes;
use StaudenmeirEloquentHasManyDeepHasRelationships;

class Lodging extends Model
{
    use SoftDeletes;
    use HasRelationships;

    protected $dates = ['start_at', 'end_at'];

    public function renter()
    {
        return $this->belongsTo(Renter::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function invoices()
    {
        return $this->hasManyThrough(Invoice::class, Bill::class);
    }

    public function payments()
    {
        return $this->hasManyDeep(Payment::class, [Bill::class, Invoice::class]);
    }

    public function getStatus()
    {
        if (!$this->start_at || !$this->end_at) {
            return 'Belum lengkap';
        }

        $now = Carbon::now();

        if ($this->start_at->lessThanOrEqualTo($now) && $this->end_at->greaterThanOrEqualTo($now)) {
            return 'Aktif';
        }

        if ($this->start_at->greaterThan($now)) {
            return 'Belum berjalan';
        }

        return 'Selesai';
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->whereHas('room', function ($query) use ($search) {
                $query->where('number', 'like', "$search%");
            })->orWhereHas('renter', function ($query) use ($search) {
                $query->where('name', 'like', "$search%");
            });
        })->when($filters['trashed'] ?? null, function ($query, $trashed) {
            if ($trashed === 'with') {
                $query->withTrashed();
            } elseif ($trashed === 'only') {
                $query->onlyTrashed();
            }
        });
    }

    public function scopeActive($query)
    {
        $now = Carbon::now();

        $query->whereNotNull('start_at')
            ->whereNotNull('end_at')
            ->where('start_at', '<=', $now)
            ->where('end_at', '>=', $now);
    }
}
