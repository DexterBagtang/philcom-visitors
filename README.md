# PhilCom Visitors

A modern visitor management system built with Laravel and React, featuring real-time notifications, badge management, and visitor tracking.

## Features

- **Visitor Check-in**: Public QR code-accessible check-in form
- **Real-time Notifications**: WebSocket-powered notifications for new visitor check-ins
- **Badge Management**: Track and assign visitor badges with availability status
- **Visit Workflow**: Manage visitor status from check-in to checkout
- **Export Data**: Export visitor records to Excel with customizable filters
- **Dark Mode**: User-customizable theme preferences
- **Notification Sounds**: Optional audio alerts for new visitors

## Tech Stack

### Backend
- **Laravel 12.x** - PHP framework
- **SQLite** - Default database
- **Laravel Reverb 1.x** - WebSocket server for real-time features
- **Inertia Laravel 2.x** - Server-side adapter
- **Maatwebsite Excel 3.1** - Excel export functionality
- **Ziggy 2.4** - Laravel route helpers for JavaScript

### Frontend
- **React 19** with **TypeScript 5.7**
- **Inertia.js 2.x** - Server-driven single-page app
- **Tailwind CSS 4.x** - Utility-first CSS
- **shadcn/ui** - UI component library (Radix UI primitives)
- **Laravel Echo 2.2** - WebSocket client
- **Vite 7.x** - Frontend build tool
- **TanStack Table 8.x** - Table component
- **date-fns 4.x** - Date utilities

## Requirements

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- SQLite (or configure another database)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd philcom-visitors
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**

   The SQLite database file should be created automatically. If not:
   ```bash
   # Windows
   type nul > database\database.sqlite

   # Linux/Mac
   touch database/database.sqlite
   ```

   Then run migrations:
   ```bash
   php artisan migrate

   # Seed database with initial data (optional)
   php artisan db:seed
   ```

6. **Build frontend assets**
   ```bash
   npm run build
   ```

## Development

### Start Development Servers

**Option 1: Start all servers at once (recommended)**
```bash
composer dev
```

This starts all required services concurrently:
- Laravel development server (port 8000)
- Queue worker
- Reverb WebSocket server
- Vite dev server

**Option 2: Start servers individually**
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker
php artisan queue:listen --tries=1

# Terminal 3: Reverb WebSocket server
php artisan reverb:start

# Terminal 4: Vite dev server
npm run dev
```

**Option 3: SSR Development**
```bash
composer dev:ssr
```

This starts the app with server-side rendering support.

### Access the Application

- **Main App**: http://localhost:8000
- **Public Check-in**: http://localhost:8000/visitor/check-in

### Default Credentials

After seeding the database:
- **Email**: admin@philcom.local
- **Password**: password

## Code Quality

```bash
# Lint JavaScript/TypeScript
npm run lint

# Type check TypeScript
npm run types

# Format with Prettier
npm run format

# Format PHP with Laravel Pint
./vendor/bin/pint
```

## Testing

The project uses **Pest PHP** for testing.

```bash
# Run all tests
composer test
# or
php artisan test

# Run with coverage
./vendor/bin/pest --coverage

# Run specific test file
php artisan test tests/Feature/VisitorTest.php

# Run Pest directly
./vendor/bin/pest
```

## Project Structure

```
philcom-visitors/
├── app/
│   ├── Events/              # Broadcasting events
│   ├── Http/Controllers/    # Application controllers
│   ├── Models/              # Eloquent models
│   └── Notifications/       # Notification classes
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── resources/
│   ├── js/
│   │   ├── components/      # React components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Page layouts
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Inertia page components
│   │   └── types/           # TypeScript types
│   └── views/               # Blade templates
├── routes/
│   ├── web.php              # Web routes
│   ├── auth.php             # Authentication routes
│   ├── channels.php         # Broadcasting channels
│   └── settings.php         # Settings routes
└── tests/                   # Test files
```

## Key Models & Relationships

### Visitor
Stores visitor information and has many visit records.

### Visit
Tracks individual visit sessions with status workflow:
- `checked_in` - Initial check-in (public)
- `ongoing` - Validated and badge assigned (staff)
- `checked_out` - Visit completed

### VisitorBadge
Physical badges with availability tracking.

### BadgeAssignment
Links visits to badges with assignment/return timestamps.

## Real-time Features

The application uses Laravel Reverb for WebSocket communication.

**Note**: Reverb server is automatically started when using `composer dev`. If running servers individually, start it manually with:
```bash
php artisan reverb:start
```

**Events**:
- `VisitCreated` - Broadcast when visitors check in
- `VisitorCreated` - Broadcast when new visitor created

**Channels**:
- `visitors` - Public visitor updates
- `visits` - Visit status changes
- Private user channels

**Frontend Integration**:
Uses `@laravel/echo-react` with `pusher-js` for real-time event listening.

## Export Feature

Export visitor data to Excel with:
- Date range filters
- Status filters (checked in, ongoing, checked out)
- Customizable columns
- Statistics dashboard

Access via the dashboard or `/exports` route.

## Configuration

### Path Aliases

TypeScript/JavaScript imports use `@/` for `resources/js/`:

```typescript
import { Button } from '@/components/ui/button';
```

### Notification Sounds

Users can toggle notification sounds in the app header. Preferences are stored in localStorage.

Sound file: `public/sounds/notification.mp3`

## Deployment

1. **Build production assets**:
   ```bash
   npm run build
   ```

2. **Optimize Laravel**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Set up queue worker** (supervisor recommended)

4. **Configure Reverb** for production WebSocket server

5. **Set environment variables**:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain.com
   ```

## Documentation

- `CLAUDE.md` - Developer guide for AI-assisted development
- `EXPORT_FEATURE_README.md` - Detailed export feature documentation
- `NOTIFICATION_SOUND_SETUP.md` - Notification sound implementation guide

## License

[Your License Here]

## Support

For issues and questions, please contact the development team or create an issue in the repository.
