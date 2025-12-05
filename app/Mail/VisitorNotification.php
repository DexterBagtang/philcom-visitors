<?php

namespace App\Mail;

use App\Models\Visit;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VisitorNotification extends Mailable
{
    use Queueable, SerializesModels;

    public Visit $visit;

    /**
     * Create a new message instance.
     */
    public function __construct(Visit $visit)
    {
        $this->visit = $visit;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Visitor Arrival Notification - ' . $this->visit->visitor->name,
            bcc: ['Dexter.Bagtang@philcom.com'],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.visitor-notification',
            with: [
                'visitorName' => $this->visit->visitor->name,
                'visitorCompany' => $this->visit->visitor->company ?? 'N/A',
                'visitPurpose' => $this->visit->visitor->visit_purpose ?? 'N/A',
                'checkInTime' => $this->visit->check_in_time->format('F j, Y g:i A'),
                'badgeNumber' => $this->visit->currentBadgeAssignment->badge->badge_number ?? 'N/A',
                'employeeName' => $this->visit->notified_employee_name ?? '',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
