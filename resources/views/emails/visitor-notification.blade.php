<x-mail::message>
# Visitor Arrival Notification

Hello {{ $employeeName }},

You have a visitor waiting for you at the lobby.

<x-mail::panel>
**Visitor Details:**

- **Name:** {{ $visitorName }}
- **Company:** {{ $visitorCompany }}
- **Purpose:** {{ $visitPurpose }}
- **Check-in Time:** {{ $checkInTime }}
- **Badge Number:** {{ $badgeNumber }}
</x-mail::panel>

Please proceed to the lobby to meet your visitor.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
