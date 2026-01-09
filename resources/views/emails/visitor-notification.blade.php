<x-mail::message>
# Visitor Arrival Notification

Hello {{ $employeeName }},

A visitor has checked in and is now in the lobby.

<x-mail::panel>
**Visitor Details:**

- **Name:** {{ $visitorName }}
- **Company:** {{ $visitorCompany }}
- **Purpose:** {{ $visitPurpose }}
- **Check-in Time:** {{ $checkInTime }}
- **Badge Number:** {{ $badgeNumber }}
</x-mail::panel>

This is to inform you of your visitor's arrival.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
