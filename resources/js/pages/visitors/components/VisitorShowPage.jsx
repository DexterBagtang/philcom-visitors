'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    ArrowLeft,
    User,
    Calendar,
    Clock,
    Target,
    Activity,
    UserCheck,
    LogOut,
    MoreVertical,
    CheckCircle,
    XCircle,
    CreditCard,
    AlertTriangle,
    Timer,
} from 'lucide-react';
const CheckoutDialog = lazy(() => import('@/pages/visitors/components/CheckoutDialog.jsx'));
const ValidationDialog = lazy(() => import('@/pages/visitors/components/ValidationDialog.jsx'));
import { router } from '@inertiajs/react';
import { format, formatDistanceToNow, intervalToDuration, formatDuration, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';

// Status config
const statusConfig = {
    checked_in: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Checked In',
        icon: Clock,
        description: 'Visitor has checked in but not yet validated',
    },
    ongoing: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Ongoing Visit',
        icon: CheckCircle,
        description: 'Visitor is validated and currently on premises',
    },
    checked_out: {
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        label: 'Checked Out',
        icon: XCircle,
        description: 'Visit has been completed',
    },
    denied: {
        color: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
        label: 'Access Denied',
        icon: XCircle,
        description: 'Visitor was denied entry',
    },
};

// Format helper using date-fns
const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: 'N/A', full: 'N/A' };

    const date = parseISO(dateString);
    return {
        date: format(date, 'EEEE, MMMM dd, yyyy'),
        time: format(date, 'h:mm a'),
        full: format(date, 'EEEE, MMMM dd, yyyy \'at\' h:mm a'),
        relative: formatDistanceToNow(date, { addSuffix: true }),
    };
};

// Calculate visit duration
const calculateVisitDuration = (checkInTime, checkOutTime = null) => {
    if (!checkInTime) return { duration: 'N/A', isOngoing: false };

    const startDate = parseISO(checkInTime);
    const endDate = checkOutTime ? parseISO(checkOutTime) : new Date();
    const isOngoing = !checkOutTime;

    const totalMinutes = differenceInMinutes(endDate, startDate);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let duration;
    if (hours > 0) {
        duration = `${hours}h ${minutes}m`;
    } else {
        duration = `${minutes}m`;
    }

    return { duration, isOngoing, totalMinutes };
};

const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

export default function VisitorShowPage({ visit, from }) {
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const currentStatus = statusConfig[visit.status] || statusConfig.checked_in;
    const visitor = visit.visitor;

    const [availableBadges, setAvailableBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);

    // Update current time every minute for ongoing visits
    useEffect(() => {
        let interval;
        if (visit.status === 'ongoing' || visit.status === 'checked_in') {
            interval = setInterval(() => {
                setCurrentTime(new Date());
            }, 60000); // Update every minute
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [visit.status]);

    const fetchAvailableBadges = useCallback(async () => {
        setIsLoadingBadges(true);
        try {
            const response = await fetch(route('visits.available-badges'));
            const data = await response.json();
            if (data.success) {
                setAvailableBadges(data.badges);
            }
        } catch (error) {
            console.error('Failed to fetch badges:', error);
            setAvailableBadges([]);
        } finally {
            setIsLoadingBadges(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailableBadges();
    }, [fetchAvailableBadges]);

    // Navigation actions
    function handleBack() {
        console.log('back', from);
        if (from === 'dashboard') {
            router.visit('/dashboard', { replace: true, preserveState: true, preserveScroll: true });
        }
        if (from === 'visitors') {
            router.visit('/visitors/index', { replace: true, preserveState: true, preserveScroll: true });
        }
    }

    // Action handlers
    const handleCheckoutVisitor = () => setShowCheckoutDialog(true);

    const handleValidateVisitor = () => setShowValidationDialog(true);

    const handleEditVisitor = () => {
        router.push(`/visitors/${visitor.id}/edit`);
    };

    const handleDeleteVisitor = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/visitors/${visitor.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Visitor deleted successfully');
                router.push('/visitors');
            } else {
                throw new Error('Failed to delete visitor');
            }
        } catch (error) {
            toast.error('Failed to delete visitor');
            console.error('Delete error:', error);
        } finally {
            setIsLoading(false);
            setShowDeleteDialog(false);
        }
    };

    // Status-based primary action
    const getPrimaryAction = () => {
        switch (visit.status) {
            case 'checked_in':
                return (
                    <Button onClick={handleValidateVisitor}>
                        <UserCheck className="mr-2 h-4 w-4" /> Validate Visitor
                    </Button>
                );
            case 'ongoing':
                return (
                    <Button variant="destructive" onClick={handleCheckoutVisitor}>
                        <LogOut className="mr-2 h-4 w-4" /> Check Out
                    </Button>
                );
            default:
                return null;
        }
    };

    // Calculate visit duration - but not for denied visits
    const visitDuration = visit.status === 'denied' 
        ? { duration: 'N/A', isOngoing: false, totalMinutes: 0 }
        : calculateVisitDuration(visit.check_in_time, visit.check_out_time);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl p-6 space-y-6">
                {/* Header with primary action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Visitor Details</h1>
                            <p className="text-sm text-slate-600">Overview of the visitor and their visit</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => handleBack()} className="gap-1">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        {/* Primary action button based on status */}
                        {getPrimaryAction()}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Enhanced Profile & Status Card */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xl font-bold">
                                            {getInitials(visitor.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-semibold truncate">{visitor.name}</h2>
                                            <p className="text-slate-600 truncate">{visitor.company}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                <Badge variant="outline" className="capitalize">
                                                    {visitor.type}
                                                </Badge>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Registered {formatDateTime(visitor.created_at).relative}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Status & Duration - Right aligned */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${currentStatus.dot}`} />
                                            <Badge className={`${currentStatus.color}`} variant="outline">
                                                <currentStatus.icon className="mr-1 h-3 w-3" />
                                                {currentStatus.label}
                                            </Badge>
                                        </div>
                                        {/* Duration Display - Don't show for denied visits */}
                                        {visit.status !== 'denied' && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Timer className="h-4 w-4 text-slate-400" />
                                                <span className="font-semibold">{visitDuration.duration}</span>
                                                {visitDuration.isOngoing && (
                                                    <span className="text-emerald-600 font-medium text-xs">ongoing</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Visit Details */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Visit Details</h3>
                                        <div className="flex gap-2 items-start">
                                            <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{visitor.person_to_visit}</p>
                                                <p className="text-xs text-slate-500">Person to Visit</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <Target className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{visitor.visit_purpose}</p>
                                                <p className="text-xs text-slate-500">Purpose</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badge & Validation Info */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Current Status</h3>
                                        {visit.status === 'denied' ? (
                                            <div className="flex gap-2 items-start">
                                                <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-red-600">Access Denied</p>
                                                    <p className="text-xs text-slate-500">
                                                        Denied by {visit.validated_by || 'Staff'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : visit.current_badge_assignment?.badge ? (
                                            <div className="flex gap-2 items-start">
                                                <CreditCard className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">Badge #{visit.current_badge_assignment.badge.badge_number}</p>
                                                    <p className="text-xs text-slate-500">Assigned at {formatDateTime(visit.current_badge_assignment.assigned_at).time}</p>
                                                </div>
                                            </div>
                                        ) : visit.status === 'checked_in' ? (
                                            <div className="flex gap-2 items-start">
                                                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">Awaiting Validation</p>
                                                    <p className="text-xs text-slate-500">No badge assigned yet</p>
                                                </div>
                                            </div>
                                        ) : null}

                                        {(visit.status === 'ongoing' || visit.status === 'checked_out') && (
                                            <div className="flex gap-2 items-start">
                                                <UserCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">Validated by {visit.validated_by}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {visit.id_type_checked && visit.id_number_checked
                                                            ? `${visit.id_type_checked}: ${visit.id_number_checked}`
                                                            : 'ID verified'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Visit Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Check-in */}
                                <div className="flex gap-3 items-start">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Checked In</p>
                                        <p className="text-xs text-slate-600">
                                            {formatDateTime(visit.check_in_time).full}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatDateTime(visit.check_in_time).relative}
                                        </p>
                                    </div>
                                </div>

                                {/* Denial */}
                                {visit.status === 'denied' && (
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100">
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-red-600">Access Denied by {visit.validated_by || 'Staff'}</p>
                                            <p className="text-xs text-slate-600">
                                                {formatDateTime(visit.validated_at).full}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(visit.validated_at).relative}
                                            </p>
                                            {visit.validation_notes && (
                                                <div className="mt-2 rounded-md bg-red-50 p-2 border border-red-100">
                                                    <p className="text-xs text-red-700">
                                                        <span className="font-semibold">Reason: </span>
                                                        {visit.validation_notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Validation */}
                                {(visit.status === 'ongoing' || visit.status === 'checked_out') && (
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-green-100">
                                            <UserCheck className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Validated by {visit.validated_by}</p>
                                            <p className="text-xs text-slate-600">
                                                {formatDateTime(visit.validated_at).full}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(visit.validated_at).relative}
                                            </p>
                                            {visit.current_badge_assignment?.badge && (
                                                <Badge variant="outline" className="mt-2 text-xs">
                                                    Badge #{visit.current_badge_assignment.badge.badge_number} assigned
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Checkout */}
                                {visit.status === 'checked_out' && visit.check_out_time && (
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100">
                                            <LogOut className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Checked Out</p>
                                            <p className="text-xs text-slate-600">
                                                {formatDateTime(visit.check_out_time).full}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(visit.check_out_time).relative}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Simplified */}
                    <div className="space-y-6">
                        {/* Key Times Card - Don't show for denied visits */}
                        {visit.status !== 'denied' && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Key Times
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Check-in</span>
                                        <span className="font-medium">{formatDateTime(visit.check_in_time).time}</span>
                                    </div>

                                    {visit.validated_at && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Validated</span>
                                            <span className="font-medium">{formatDateTime(visit.validated_at).time}</span>
                                        </div>
                                    )}

                                    {visit.check_out_time ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Check-out</span>
                                            <span className="font-medium">{formatDateTime(visit.check_out_time).time}</span>
                                        </div>
                                    ) : (visit.status === 'ongoing' || visit.status === 'checked_in') && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Current time</span>
                                            <span className="font-medium text-emerald-600">
                                                {format(currentTime, 'h:mm a')}
                                            </span>
                                        </div>
                                    )}

                                    <Separator />
                                    <div className="flex justify-between items-center font-medium">
                                        <span className="text-slate-900">Total Duration</span>
                                        <span className="text-lg">{visitDuration.duration}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Denial Reason Card - Show for denied visits */}
                        {visit.status === 'denied' && visit.validation_notes && (
                            <Card className="border-red-200 bg-red-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                                        <XCircle className="h-4 w-4" /> Denial Reason
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-red-700">{visit.validation_notes}</p>
                                    {visit.validated_by && (
                                        <p className="text-xs text-red-600 mt-2">
                                            Denied by: {visit.validated_by}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Additional Details - Only if relevant (don't show for denied since it's shown above) */}
                        {visit.validation_notes && visit.status !== 'denied' && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Validation Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">{visit.validation_notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <Suspense fallback={null}>
                <CheckoutDialog
                    isOpen={showCheckoutDialog}
                    onClose={() => setShowCheckoutDialog(false)}
                    visit={visit}
                    onSuccess={() => {
                        toast.success('Visitor checked out successfully');
                        router.refresh();
                    }}
                />
            </Suspense>

            <Suspense fallback={null}>
                <ValidationDialog
                    isOpen={showValidationDialog}
                    onClose={() => setShowValidationDialog(false)}
                    visit={visit}
                    visitor={visitor}
                    onSuccess={() => {
                        toast.success('Visitor validated successfully');
                        router.refresh();
                    }}
                    availableBadges={availableBadges}
                />
            </Suspense>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Visitor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {visitor.name}? This action cannot be undone and will permanently remove all visitor data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVisitor}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
