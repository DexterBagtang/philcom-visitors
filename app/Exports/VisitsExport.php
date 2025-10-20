<?php

namespace App\Exports;

use App\Models\Visit;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class VisitsExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, WithColumnWidths, ShouldAutoSize
{
    protected $dateFrom;
    protected $dateTo;
    protected $status;
    protected $includeCheckOut;

    public function __construct($dateFrom = null, $dateTo = null, $status = null, $includeCheckOut = true)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->status = $status;
        $this->includeCheckOut = $includeCheckOut;
    }

    public function query()
    {
        $query = Visit::query()->with(['visitor', 'latestBadgeAssignment.badge']);

        // Apply date range filter
        if ($this->dateFrom && $this->dateTo) {
            $query->whereBetween('check_in_time', [
                Carbon::parse($this->dateFrom)->startOfDay(),
                Carbon::parse($this->dateTo)->endOfDay()
            ]);
        } elseif ($this->dateFrom) {
            $query->where('check_in_time', '>=', Carbon::parse($this->dateFrom)->startOfDay());
        } elseif ($this->dateTo) {
            $query->where('check_in_time', '<=', Carbon::parse($this->dateTo)->endOfDay());
        }

        // Apply status filter
        if ($this->status && $this->status !== 'all') {
            $query->where('status', $this->status);
        }

        return $query->orderBy('check_in_time', 'desc');
    }

    public function headings(): array
    {
        $headings = [
            'Visit ID',
            'First Name',
            'Last Name',
            'Company',
            'Visitor Type',
            'Person to Visit',
            'Purpose of Visit',
            'Status',
            'Badge Number',
            'Check-in Date',
            'Check-in Time',
        ];

        if ($this->includeCheckOut) {
            $headings[] = 'Check-out Date';
            $headings[] = 'Check-out Time';
            $headings[] = 'Duration (Hours)';
        }

        $headings[] = 'Validated By';
        $headings[] = 'ID Type Checked';
        $headings[] = 'ID Number';

        return $headings;
    }

    public function map($visit): array
    {
        $checkInTime = $visit->check_in_time ? Carbon::parse($visit->check_in_time) : null;
        $checkOutTime = $visit->check_out_time ? Carbon::parse($visit->check_out_time) : null;

        // Calculate duration
        $duration = '';
        if ($checkInTime && $checkOutTime) {
            $diffInMinutes = $checkInTime->diffInMinutes($checkOutTime);
            $hours = floor($diffInMinutes / 60);
            $minutes = $diffInMinutes % 60;
            $duration = sprintf('%d:%02d', $hours, $minutes);
        }

        $row = [
            $visit->id,
            $visit->visitor->first_name ?? '',
            $visit->visitor->last_name ?? '',
            $visit->visitor->company ?? 'N/A',
            ucfirst($visit->visitor->type ?? 'N/A'),
            $visit->visitor->person_to_visit ?? '',
            $visit->visitor->visit_purpose ?? '',
            ucfirst($visit->status),
            $visit->latestBadgeAssignment->badge->badge_number ?? 'Not Assigned',
            $checkInTime ? $checkInTime->format('Y-m-d') : '',
            $checkInTime ? $checkInTime->format('h:i A') : '',
        ];

        if ($this->includeCheckOut) {
            $row[] = $checkOutTime ? $checkOutTime->format('Y-m-d') : '';
            $row[] = $checkOutTime ? $checkOutTime->format('h:i A') : '';
            $row[] = $duration;
        }

        $row[] = $visit->validated_by ?? 'Not Validated';
        $row[] = $visit->id_type_checked ?? '';
        $row[] = $visit->id_number_checked ?? '';

        return $row;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row (header)
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF']
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ],
        ];
    }

    public function title(): string
    {
        $dateRange = '';
        if ($this->dateFrom && $this->dateTo) {
            $dateRange = Carbon::parse($this->dateFrom)->format('M d') . ' - ' . Carbon::parse($this->dateTo)->format('M d, Y');
        } elseif ($this->dateFrom) {
            $dateRange = 'From ' . Carbon::parse($this->dateFrom)->format('M d, Y');
        } elseif ($this->dateTo) {
            $dateRange = 'Until ' . Carbon::parse($this->dateTo)->format('M d, Y');
        } else {
            $dateRange = 'All Records';
        }

        return 'Visitors ' . $dateRange;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 10,  // Visit ID
            'B' => 15,  // First Name
            'C' => 15,  // Last Name
            'D' => 20,  // Company
            'E' => 15,  // Type
            'F' => 20,  // Person to Visit
            'G' => 30,  // Purpose
            'H' => 12,  // Status
            'I' => 15,  // Badge
            'J' => 18,  // Check-in Date
            'K' => 15,  // Check-in Time
        ];
    }
}
