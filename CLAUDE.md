# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PhilCom Visitors is a visitor management system built with Laravel (backend) and React with TypeScript (frontend) using Inertia.js. The system tracks visitor check-ins, manages visitor badges, and provides real-time notifications using Laravel Reverb for WebSocket communication.

## Development Commands

### Setup and Installation
```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Run database migrations
php artisan migrate

# Seed database (if needed)
php artisan db:seed
```

### Development
```bash
# Start development servers (Laravel, Queue, and Vite)
composer dev

# Or start with SSR support
composer dev:ssr

# Alternative: Start servers individually
php artisan serve                    # Laravel server on port 8000
php artisan queue:listen --tries=1   # Queue worker
npm run dev                          # Vite dev server

# Start Reverb WebSocket server (for real-time features)
php artisan reverb:start
```

### Building
```bash
# Build frontend assets for production
npm run build

# Build with SSR support
npm run build:ssr
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run type checking
npm run types

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check

# Run Laravel Pint (PHP formatting)
./vendor/bin/pint
```

### Testing
```bash
# Run all tests
composer test
# Or directly:
php artisan test

# Run specific test file
php artisan test tests/Feature/VisitorTest.php

# Run tests with coverage (Pest)
./vendor/bin/pest --coverage
```

## Architecture

### Backend (Laravel)

**Core Models and Relationships:**
- `Visitor` - Stores visitor information (first_name, last_name, company, person_to_visit, visit_purpose, type)
  - Has many `Visit` records
  - Has one `currentVisit` (latest ongoing/checked_in visit)
- `Visit` - Tracks individual visit sessions with status workflow: checked_in → ongoing → checked_out
  - Belongs to a `Visitor`
  - Has many `BadgeAssignment` records
  - Has one `currentBadgeAssignment` (unreturned badge)
- `VisitorBadge` - Physical badges with status tracking (available/assigned)
- `BadgeAssignment` - Links visits to badges with assignment/return timestamps
- `User` - Staff users who manage the system

**Visit Status Workflow:**
1. `checked_in` - Visitor submits check-in form (public, no auth)
2. `ongoing` - Staff validates visitor and assigns badge (requires authentication)
3. `checked_out` - Visitor completes visit, badge returned

**Key Controllers:**
- `VisitorController` - Handles public check-in form and visitor management
- `VisitController` - Manages visit validation, badge assignment, checkout, and denial
- `BadgeController` - CRUD operations for visitor badges
- `ExportController` - Exports visitor data to Excel with customizable filters
- `DashboardController` - Displays dashboard with today's visitors

**Real-time Events (Laravel Reverb):**
- `VisitCreated` - Broadcast when new visitor checks in
- `VisitorCreated` - Broadcast when new visitor is created
- Channels: `visitors`, `visits`, and private user channels

### Frontend (React + TypeScript + Inertia.js)

**Project Structure:**
- `resources/js/pages/` - Inertia page components
  - `auth/` - Authentication pages (login, register, password reset)
  - `dashboard/` - Dashboard with real-time visitor updates
  - `visitors/` - Visitor management, check-in forms (public and QR)
  - `badges/` - Badge management interface
  - `exports/` - Export data to Excel
  - `settings/` - User profile and appearance settings
- `resources/js/components/` - Reusable React components
  - `ui/` - shadcn/ui components (buttons, dialogs, tables, etc.)
  - `notification-sound-toggle.tsx` - Controls notification sound preferences
  - `audio-initializer.tsx` - Initializes audio context for notifications
- `resources/js/layouts/` - Page layout templates
  - `app-layout.tsx` - Main authenticated app layout with sidebar
  - `auth-layout.tsx` - Authentication pages layout
  - `settings/layout.tsx` - Settings pages layout
- `resources/js/lib/` - Utility functions
  - `utils.ts` - General utilities (cn for className merging)
  - `notification-sound.ts` - Notification sound manager
  - `sound-generator.ts` - Generates notification sounds
- `resources/js/types/` - TypeScript type definitions
- `resources/js/hooks/` - Custom React hooks
  - `use-appearance.tsx` - Theme management (light/dark mode)
  - `use-mobile.tsx` - Mobile device detection

**UI Library:**
- Uses shadcn/ui (Radix UI primitives + Tailwind CSS)
- Components configured in `components.json`
- Styling with Tailwind CSS v4 and `class-variance-authority`

**State Management:**
- Inertia.js for server-driven state
- Local state with React hooks
- Real-time updates via Laravel Echo/Reverb

**Path Aliases:**
- `@/*` resolves to `resources/js/*` (configured in tsconfig.json and vite.config.ts)
- `ziggy-js` for Laravel route helpers in frontend

### Special Features

**Notification Sound System:**
- Plays sound when visitors check in (real-time via WebSocket)
- User can enable/disable via toggle in app header
- Preferences stored in localStorage
- Sound file: `public/sounds/notification.mp3`
- See `NOTIFICATION_SOUND_SETUP.md` for details

**Visitor Export:**
- Export to Excel with date ranges, status filters
- Customizable columns (include/exclude checkout data)
- Statistics dashboard (today, week, month, all-time)
- Uses `maatwebsite/excel` package
- See `EXPORT_FEATURE_README.md` for detailed documentation

**Public Check-in:**
- QR code accessible check-in form at `/visitor/check-in`
- No authentication required
- Supports multiple visitor types (client, employee, contractor, etc.)

## Important Notes

### Database
- Default database: SQLite (`database/database.sqlite`)
- Migrations in `database/migrations/`
- Key tables: users, visitors, visits, visitor_badges, badge_assignments, system_settings

### Authentication & Authorization
- Uses Laravel Breeze with Inertia React
- Routes in `routes/auth.php` for authentication
- Settings routes in `routes/settings.php`
- Main application routes in `routes/web.php`

### Real-time Features
- Laravel Reverb (WebSocket server) is required for notifications
- Echo configuration in `resources/js/app.tsx`
- Broadcasting channels defined in `routes/channels.php`
- Must run `php artisan reverb:start` for real-time features

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` for `resources/js/*`
- JSX mode: `react-jsx` (automatic runtime)
- Target: ESNext with bundler module resolution

### Environment
- Copy `.env.example` to `.env` for local setup
- Configure database, queue, and broadcasting settings
- Reverb app credentials required for WebSocket

## Common Development Patterns

### Creating New Pages
1. Add page component in `resources/js/pages/`
2. Create route in `routes/web.php` using `Inertia::render()`
3. Return data from controller using `inertia()` helper

### Adding UI Components
- Use existing shadcn/ui components from `resources/js/components/ui/`
- Install new shadcn components using their CLI if needed
- Follow component composition patterns with Radix UI

### Working with Models
- Use Eloquent relationships defined in models
- Leverage eager loading to prevent N+1 queries: `$visit->load(['visitor', 'badgeAssignments.badge'])`
- Use database transactions for operations affecting multiple models

### Broadcasting Events
1. Create event in `app/Events/` implementing `ShouldBroadcast`
2. Define channel authorization in `routes/channels.php`
3. Listen in frontend using `useChannel` from `@laravel/echo-react`

### Testing
- Uses Pest PHP for testing
- Test files in `tests/Feature/` and `tests/Unit/`
- Follow existing test patterns in the codebase
