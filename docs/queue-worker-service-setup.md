# Queue Worker Service Setup

The visitor check-in flow dispatches `App\Jobs\SendVisitorNotification` (email to the host) onto the `database` queue connection. A persistent queue worker must be running at all times for these emails to actually go out — without it, jobs just sit in the `jobs` table (or silently accumulate) and hosts never get notified.

This is run as a systemd service, `laravel-queue.service`, on the production host (`visitor-pgc`).

## 1. Prerequisites

- `QUEUE_CONNECTION=database` in `.env`
- `jobs` and `failed_jobs` tables migrated (`php artisan queue:table`, `php artisan queue:failed-table`, `php artisan migrate`)
- App deployed at `/var/www/philcom-visitors`, running as `www-data`

## 2. Create the systemd unit

Create `/etc/systemd/system/laravel-queue.service`:

```ini
[Unit]
Description=Laravel Queue Worker
After=network.target mysql.service redis.service

[Service]
User=www-data
Group=www-data
Restart=always
RestartSec=5
StartLimitIntervalSec=0
ExecStart=/usr/bin/php /var/www/philcom-visitors/artisan queue:work --queue=default --tries=3 --sleep=3 --timeout=90
WorkingDirectory=/var/www/philcom-visitors
StandardOutput=journal
StandardError=journal
SyslogIdentifier=laravel-queue

[Install]
WantedBy=multi-user.target
```

> **Do not add `Requires=mysql.service`.** Use `After=` only for ordering. `Requires=` creates a hard dependency: if mysql ever restarts (patching, reboot, maintenance), systemd cascades a clean stop to the queue worker too — and because that's a dependency-triggered stop (not a crash), `Restart=always` does **not** kick back in, and nothing restarts the worker when mysql comes back. This caused a real ~2 week outage of host notification emails (2026-06-24 to 2026-07-07) with no crash logged and nothing in `failed_jobs`, since the worker just never came back up. The job's own retry/backoff (`$tries = 3`, backoff `[60, 120, 300]`) already handles transient DB unavailability, so the hard dependency isn't needed.

## 3. Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable laravel-queue.service
sudo systemctl start laravel-queue.service
```

## 4. Verify it's running

```bash
sudo systemctl status laravel-queue.service --no-pager -l
```

You should see `Active: active (running)` and a `Main PID`. Live activity streams via journal:

```bash
sudo journalctl -u laravel-queue.service -f
```

Each processed job logs a `RUNNING` line followed by `DONE`.

## 5. Health checks

- **Pending jobs stuck?** `php artisan tinker --execute="echo DB::table('jobs')->count();"` — should stay near 0 if the worker is keeping up.
- **Failed jobs:** `php artisan queue:failed` lists any job that exhausted its 3 tries. `SendVisitorNotification::failed()` also writes the error into the `visits.notification_error` column, so you can check `visits` directly for hosts that never got notified.
- **Service down unexpectedly:** `systemctl status laravel-queue.service` — if it shows `inactive (dead)` with a clean exit (`status=0/SUCCESS`) rather than a crash, check whether mysql or redis was recently restarted and whether the unit file has re-acquired a hard `Requires=` dependency.
