'use client';

import { useCallback, useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import CheckoutDialog from '@/pages/visitors/components/CheckoutDialog.jsx';
import ValidationDialog from '@/pages/visitors/components/ValidationDialog.jsx';
import { router } from '@inertiajs/react';

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
};

// Format helper
const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };

    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }),
    };
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

export default function VisitorShowPage({ visit,from }) {
    // const router = useRouter();
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentStatus = statusConfig[visit.status] || statusConfig.checked_in;
    const visitor = visit.visitor;

    const [availableBadges, setAvailableBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);

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
    function handleBack(){
        console.log('back',from);
        if (from === 'dashboard'){
            router.visit('/dashboard',{replace:true,preserveState:true,preserveScroll:true})
        }
        if(from === 'visitors'){
            router.visit('/visitors/index',{replace:true,preserveState:true,preserveScroll:true})
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

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl p-6 space-y-6">
                {/* Header with primary action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={()=>handleBack()} className="gap-1">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Visitor Details</h1>
                            <p className="text-sm text-slate-600">Overview of the visitor and their visit</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Primary action button based on status */}
                        {getPrimaryAction()}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleEditVisitor}>
                                    <User className="mr-2 h-4 w-4" /> Edit Visitor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                    {/*<Trash2 className="mr-2 h-4 w-4" /> Delete Visitor*/}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xl font-bold">
                                        {getInitials(visitor.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-semibold truncate">{visitor.name}</h2>
                                        <p className="text-slate-600 truncate">{visitor.company}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant="outline" className="capitalize">
                                                {visitor.type}
                                            </Badge>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registered {formatDateTime(visitor.created_at).date}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <h3 className="text-sm font-medium mb-3 text-slate-900">Visit Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            {formatDateTime(visit.check_in_time).date} at {formatDateTime(visit.check_in_time).time}
                                        </p>
                                    </div>
                                </div>

                                {/* Validation */}
                                {(visit.status === 'ongoing' || visit.status === 'checked_out') && (
                                    <div className="flex gap-3 items-start">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-green-100">
                                            <UserCheck className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Validated by {visit.validated_by}</p>
                                            <p className="text-xs text-slate-600">
                                                {formatDateTime(visit.validated_at).date} at {formatDateTime(visit.validated_at).time}
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
                                                {formatDateTime(visit.check_out_time).date} at {formatDateTime(visit.check_out_time).time}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Current Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`h-3 w-3 rounded-full ${currentStatus.dot}`} />
                                    <Badge className={`${currentStatus.color}`} variant="outline">
                                        <currentStatus.icon className="mr-1 h-3 w-3" />
                                        {currentStatus.label}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-600">{currentStatus.description}</p>
                            </CardContent>
                        </Card>

                        {/* Badge Card */}
                        {visit.current_badge_assignment?.badge && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" /> Badge Assignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Badge Number</span>
                                        <Badge variant="outline">#{visit.current_badge_assignment.badge.badge_number}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Location</span>
                                        <span>{visit.current_badge_assignment.badge.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Assigned</span>
                                        <span>{formatDateTime(visit.current_badge_assignment.assigned_at).time}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Validation Details Card */}
                        {(visit.status === 'ongoing' || visit.status === 'checked_out') && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" /> Validation Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-medium">ID Type</p>
                                        <p className="text-slate-600">{visit.id_type_checked || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">ID Number</p>
                                        <p className="font-mono text-slate-600">{visit.id_number_checked || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Validated By</p>
                                        <p className="text-slate-600">{visit.validated_by || 'N/A'}</p>
                                    </div>
                                    {visit.validation_notes && (
                                        <div>
                                            <p className="font-medium">Notes</p>
                                            <p className="text-slate-600">{visit.validation_notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <CheckoutDialog
                isOpen={showCheckoutDialog}
                onClose={() => setShowCheckoutDialog(false)}
                visit={visit}
                onSuccess={() => {
                    toast.success('Visitor checked out successfully');
                    router.refresh();
                }}
            />

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
