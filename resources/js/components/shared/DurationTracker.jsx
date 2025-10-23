import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Calculate duration between two dates
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time (optional, defaults to now)
 * @returns {Object} - Object with hours, minutes, totalMinutes, and formatted string
 */
export const calculateDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return {
        hours,
        minutes,
        totalMinutes: diffMins,
        formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        isLong: diffMins > 240, // More than 4 hours
        isVeryLong: diffMins > 480 // More than 8 hours
    };
};

/**
 * Live Duration Tracker Component
 * Updates every minute to show real-time duration
 */
export default function DurationTracker({ 
    startTime, 
    endTime = null, 
    status = 'ongoing',
    showIcon = true,
    className = '',
    variant = 'default' // 'default', 'badge', 'compact'
}) {
    const [duration, setDuration] = useState(() => calculateDuration(startTime, endTime));

    useEffect(() => {
        // Only update if still ongoing (no end time)
        if (!endTime && status === 'ongoing') {
            const interval = setInterval(() => {
                setDuration(calculateDuration(startTime));
            }, 60000); // Update every minute

            return () => clearInterval(interval);
        } else {
            // For completed visits, calculate once
            setDuration(calculateDuration(startTime, endTime));
        }
    }, [startTime, endTime, status]);

    // Variant: Compact (minimal display)
    if (variant === 'compact') {
        return (
            <span className={cn('text-xs font-medium', className)}>
                {duration.formatted}
            </span>
        );
    }

    // Variant: Badge (colored badge with warnings)
    if (variant === 'badge') {
        const getBadgeStyles = () => {
            if (duration.isVeryLong) {
                return 'bg-red-100 text-red-700 border-red-200';
            }
            if (duration.isLong) {
                return 'bg-amber-100 text-amber-700 border-amber-200';
            }
            if (status === 'ongoing') {
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            }
            return 'bg-slate-100 text-slate-700 border-slate-200';
        };

        return (
            <div className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-1', getBadgeStyles(), className)}>
                {showIcon && (
                    duration.isVeryLong ? (
                        <AlertTriangle className="h-3 w-3 animate-pulse" />
                    ) : (
                        <Clock className="h-3 w-3" />
                    )
                )}
                <span className="text-xs font-medium">{duration.formatted}</span>
            </div>
        );
    }

    // Variant: Default (full display with status)
    const getTextColor = () => {
        if (duration.isVeryLong) return 'text-red-600';
        if (duration.isLong) return 'text-amber-600';
        return 'text-slate-700';
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {showIcon && (
                duration.isVeryLong ? (
                    <AlertTriangle className={cn('h-4 w-4 animate-pulse', getTextColor())} />
                ) : (
                    <Clock className={cn('h-4 w-4', getTextColor())} />
                )
            )}
            <div className="flex flex-col">
                <span className={cn('text-sm font-medium', getTextColor())}>
                    {duration.formatted}
                </span>
                {status === 'ongoing' && duration.isLong && (
                    <span className="text-xs text-amber-600">
                        {duration.isVeryLong ? 'Extended stay' : 'Long visit'}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Duration Display Component (static, no live updates)
 */
export function DurationDisplay({ startTime, endTime, className = '' }) {
    const duration = calculateDuration(startTime, endTime);
    
    return (
        <span className={cn('text-sm text-slate-700', className)}>
            {duration.formatted}
        </span>
    );
}

/**
 * Duration Stats Component (for summary displays)
 */
export function DurationStats({ visits = [], className = '' }) {
    // Return early if no visits
    if (!visits || visits.length === 0) {
        return (
            <div className={cn('grid gap-3', className)}>
                <div className="space-y-1">
                    <p className="text-xs text-slate-500">Average Duration</p>
                    <p className="text-lg font-semibold text-slate-900">0m</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-slate-500">Longest Visit</p>
                    <p className="text-lg font-semibold text-slate-900">0m</p>
                </div>
            </div>
        );
    }

    const stats = visits.reduce((acc, visit) => {
        if (visit.status === 'ongoing' || visit.status === 'checked_out') {
            const duration = calculateDuration(
                visit.check_in_time, 
                visit.check_out_time
            );
            acc.total += duration.totalMinutes;
            acc.count += 1;
            
            if (duration.isVeryLong) acc.extended += 1;
            if (duration.totalMinutes > acc.longest) {
                acc.longest = duration.totalMinutes;
                acc.longestFormatted = duration.formatted;
            }
        }
        return acc;
    }, { total: 0, count: 0, extended: 0, longest: 0, longestFormatted: '0m' });

    const avgMinutes = stats.count > 0 ? Math.floor(stats.total / stats.count) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    const avgFormatted = avgHours > 0 ? `${avgHours}h ${avgMins}m` : `${avgMins}m`;

    return (
        <div className={cn('grid gap-3', className)}>
            <div className="space-y-1">
                <p className="text-xs text-slate-500">Average Duration</p>
                <p className="text-lg font-semibold text-slate-900">{avgFormatted}</p>
            </div>
            <div className="space-y-1">
                <p className="text-xs text-slate-500">Longest Visit</p>
                <p className="text-lg font-semibold text-slate-900">{stats.longestFormatted}</p>
            </div>
            {stats.extended > 0 && (
                <div className="space-y-1">
                    <p className="text-xs text-amber-600">Extended Visits</p>
                    <p className="text-lg font-semibold text-amber-700">{stats.extended}</p>
                </div>
            )}
        </div>
    );
}
