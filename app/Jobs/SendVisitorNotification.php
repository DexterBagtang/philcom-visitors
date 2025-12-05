<?php

namespace App\Jobs;

use App\Mail\VisitorNotification;
use App\Models\Visit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendVisitorNotification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $timeout = 30;
    public $backoff = [60, 120, 300]; // Retry after 1min, 2min, 5min

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $visitId,
        public string $employeeEmail,
        public string $employeeName
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $visit = Visit::with(['visitor', 'currentBadgeAssignment.badge'])
                ->findOrFail($this->visitId);

            Mail::to($this->employeeEmail)
                ->send(new VisitorNotification($visit));

            // Update visit record to mark notification as sent
            $visit->update([
                'notification_sent' => true,
                'notification_sent_at' => now(),
                'notification_error' => null, // Clear any previous errors
            ]);

            Log::info('Visitor notification sent successfully via queue', [
                'visit_id' => $this->visitId,
                'employee_email' => $this->employeeEmail,
                'employee_name' => $this->employeeName,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send visitor notification from queue', [
                'visit_id' => $this->visitId,
                'employee_email' => $this->employeeEmail,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            // Store error in visit record if this was the last attempt
            if ($this->attempts() >= $this->tries) {
                Visit::where('id', $this->visitId)->update([
                    'notification_error' => $e->getMessage(),
                ]);
            }

            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Visitor notification job failed permanently', [
            'visit_id' => $this->visitId,
            'employee_email' => $this->employeeEmail,
            'error' => $exception->getMessage(),
        ]);

        // Mark notification as failed in database
        Visit::where('id', $this->visitId)->update([
            'notification_error' => 'Failed after ' . $this->tries . ' attempts: ' . $exception->getMessage(),
        ]);
    }
}
