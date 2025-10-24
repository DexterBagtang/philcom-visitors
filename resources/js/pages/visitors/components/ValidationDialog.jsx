import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { AlertCircle, Building, Check, Clock, FileText, IdCard, Loader, User, Grid3x3, X, Shield, Calendar, Target } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ValidationDialog({ isOpen, onClose, visitor, visit, onSuccess, availableBadges = [] }) {
    const [formData, setFormData] = useState({
        id_type_checked: '',
        validation_notes: '',
        selected_badge_id: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDenying, setIsDenying] = useState(false);
    const [errors, setErrors] = useState({});
    const [badgeInput, setBadgeInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showBadgePanel, setShowBadgePanel] = useState(false);

    const idTypes = ['National ID', 'Passport', "Driver's License", 'Company ID', 'Student ID', 'Other'];

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const filteredBadges = availableBadges.filter((badge) => badge.badge_number.toLowerCase().includes(badgeInput.toLowerCase()));

    const handleBadgeInputChange = (value) => {
        setBadgeInput(value);
        setShowSuggestions(value.length > 0);

        const exactMatch = availableBadges.find((badge) => badge.badge_number.toLowerCase() === value.toLowerCase());

        if (exactMatch) {
            handleInputChange('selected_badge_id', exactMatch.id.toString());
        } else {
            handleInputChange('selected_badge_id', '');
        }
    };

    const handleSuggestionSelect = (badge) => {
        setBadgeInput(badge.badge_number);
        handleInputChange('selected_badge_id', badge.id.toString());
        setShowSuggestions(false);
    };

    const handleBadgeSelectFromPanel = (badge) => {
        setBadgeInput(badge.badge_number);
        handleInputChange('selected_badge_id', badge.id.toString());
        setShowBadgePanel(false);
    };

    const selectedBadge = availableBadges.find((badge) => badge.id.toString() === formData.selected_badge_id);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.id_type_checked) {
            newErrors.id_type_checked = 'ID type is required';
        }

        if (!formData.selected_badge_id) {
            newErrors.selected_badge_id = 'Please select a badge to assign';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            router.post(
                route('visits.validate', visit.id),
                {
                    ...formData,
                    validated_by: window.auth?.user?.name || 'Staff',
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Visitor validated successfully', {
                            description: `${visitor?.name} has been validated and assigned badge #${selectedBadge?.badge_number}. Visit is now active.`,
                            duration: 4000,
                        });
                        onClose();
                        setFormData({
                            id_type_checked: '',
                            validation_notes: '',
                            selected_badge_id: '',
                        });
                        setErrors({});
                    },
                    onError: (errors) => {
                        setErrors(errors);
                        toast.error('Validation failed', {
                            description: errors.message || 'There was an error validating the visitor. Please check the form and try again.',
                            duration: 4000,
                        });
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                        resetDialog();
                        onClose;
                    },
                },
            );
        } catch (error) {
            console.error('Validation error:', error);
            setIsSubmitting(false);
            toast.error('Validation failed', {
                description: 'An unexpected error occurred. Please try again.',
                duration: 4000,
            });
        }
    };

    const validateDenyForm = () => {
        const newErrors = {};
        if (!formData.validation_notes) {
            newErrors.validation_notes = 'Notes is required when visitor is Denied';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDeny = (e) => {
        e.preventDefault();

        if (!validateDenyForm()) return;

        setIsDenying(true);

        router.post(
            route('visits.deny', visit.id),
            { ...formData },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.warning('Visitor Denied', {
                        description: `${visitor?.name} has been denied`,
                        duration: 4000,
                    });
                },
                onError: (errors) => {
                    setErrors(errors);
                    toast.error('Validation failed', {
                        description: errors.message || 'There was an error validating the visitor. Please check the form and try again.',
                        duration: 4000,
                    });
                },
                onFinish: () => {
                    setIsDenying(false);
                    handleClose();
                },
            },
        );
    };

    if (!visitor || !visit) return null;

    const resetDialog = () => {
        setFormData({
            id_type_checked: '',
            validation_notes: '',
            selected_badge_id: '',
        });
        setErrors({});
        setBadgeInput('');
        setShowSuggestions(false);
        setShowBadgePanel(false);
    };

    const handleClose = () => {
        resetDialog();
        onClose();
    };

    // Helper function to get visitor type badge color
    const getVisitorTypeBadge = (type) => {
        const typeColors = {
            client: 'bg-blue-100 text-blue-700 border-blue-300',
            employee: 'bg-green-100 text-green-700 border-green-300',
            contractor: 'bg-amber-100 text-amber-700 border-amber-300',
            vendor: 'bg-purple-100 text-purple-700 border-purple-300',
            visitor: 'bg-gray-100 text-gray-700 border-gray-300',
        };
        return typeColors[type?.toLowerCase()] || typeColors.visitor;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[650px] !max-h-[90vh] !max-w-3xl overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2.5 text-xl">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-sm">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                            Validate Visitor
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Please verify the visitor's identity and assign a badge to complete the check-in process.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    {/* Enhanced Visitor Information Display */}
                    <div className="space-y-4 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                                <User className="h-4.5 w-4.5 text-blue-600" />
                                Visitor Information
                            </h3>
                            <Badge className={cn('border px-2.5 py-0.5 text-xs font-medium', getVisitorTypeBadge(visitor.type))}>
                                {visitor.type}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Name */}
                            <div className="group rounded-lg bg-white/60 p-3 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-blue-100 p-2 transition-colors group-hover:bg-blue-200">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{visitor.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company */}
                            <div className="group rounded-lg bg-white/60 p-3 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-purple-100 p-2 transition-colors group-hover:bg-purple-200">
                                        <Building className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{visitor.company}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Check-in Time */}
                            <div className="group rounded-lg bg-white/60 p-3 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-green-100 p-2 transition-colors group-hover:bg-green-200">
                                        <Clock className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check-in Time</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                                            {new Date(visit.check_in_time).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Visiting */}
                            <div className="group rounded-lg bg-white/60 p-3 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-amber-100 p-2 transition-colors group-hover:bg-amber-200">
                                        <Target className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Visiting</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{visitor.person_to_visit}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purpose - Full Width */}
                            <div className="group rounded-lg bg-white/60 p-3 shadow-sm transition-all hover:shadow-md sm:col-span-2">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-indigo-100 p-2 transition-colors group-hover:bg-indigo-200">
                                        <FileText className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purpose of Visit</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{visitor.visit_purpose}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ID Verification Section */}
                    <div className="space-y-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/50 to-slate-50/30 p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                            <div className="rounded-md bg-slate-100 p-1.5">
                                <Shield className="h-4 w-4 text-slate-600" />
                            </div>
                            ID Verification
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="id_type" className="text-sm font-medium">ID Type *</Label>
                            <Select value={formData.id_type_checked} onValueChange={(value) => handleInputChange('id_type_checked', value)}>
                                <SelectTrigger className={cn(
                                    'h-11 transition-all',
                                    errors.id_type_checked
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                )}>
                                    <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {idTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            <div className="flex items-center gap-2">
                                                <IdCard className="h-3.5 w-3.5 text-gray-500" />
                                                {type}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.id_type_checked && (
                                <p className="flex items-center gap-1.5 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errors.id_type_checked}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Badge Assignment Section */}
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30 p-5">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                            <div className="rounded-md bg-emerald-100 p-1.5">
                                <IdCard className="h-4 w-4 text-emerald-600" />
                            </div>
                            Badge Assignment
                        </h3>

                        <Label htmlFor="badge-input" className="text-sm font-medium">Assign Badge *</Label>

                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="badge-input"
                                    placeholder="Type badge number (e.g., 001, B-123)"
                                    value={badgeInput}
                                    onChange={(e) => handleBadgeInputChange(e.target.value)}
                                    onFocus={() => setShowSuggestions(badgeInput.length > 0)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className={cn(
                                        'h-11 transition-all',
                                        errors.selected_badge_id
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                    )}
                                    autoComplete="off"
                                />

                                {/* Enhanced Suggestions Dropdown */}
                                {showSuggestions && filteredBadges.length > 0 && (
                                    <div className="absolute z-50 mt-2 max-h-48 w-full overflow-y-auto rounded-lg border-2 border-emerald-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2">
                                        {filteredBadges.slice(0, 8).map((badge, index) => (
                                            <div
                                                key={badge.id}
                                                onClick={() => handleSuggestionSelect(badge)}
                                                className={cn(
                                                    'flex cursor-pointer items-center justify-between border-b p-3 transition-all last:border-b-0',
                                                    selectedBadge?.id === badge.id
                                                        ? 'bg-emerald-50 hover:bg-emerald-100'
                                                        : 'hover:bg-gray-50'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {selectedBadge?.id === badge.id && (
                                                        <div className="rounded-full bg-emerald-500 p-0.5">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                    <IdCard className={cn(
                                                        'h-4 w-4',
                                                        selectedBadge?.id === badge.id ? 'text-emerald-600' : 'text-gray-400'
                                                    )} />
                                                    <span className={cn(
                                                        'text-sm font-semibold',
                                                        selectedBadge?.id === badge.id ? 'text-emerald-700' : 'text-gray-700'
                                                    )}>
                                                        Badge #{badge.badge_number}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs bg-white">
                                                    {badge.location || 'Available'}
                                                </Badge>
                                            </div>
                                        ))}
                                        {filteredBadges.length > 8 && (
                                            <div className="border-t bg-gray-50 p-2.5 text-center text-xs font-medium text-gray-600">
                                                + {filteredBadges.length - 8} more available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Browse Badges Button with Tooltip */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={availableBadges.length === 0}
                                            onClick={() => setShowBadgePanel(!showBadgePanel)}
                                            className={cn(
                                                'h-11 w-11 shrink-0 transition-all',
                                                showBadgePanel
                                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200'
                                                    : 'hover:bg-emerald-50 hover:border-emerald-300'
                                            )}
                                        >
                                            <Grid3x3 className="h-4.5 w-4.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-gray-900">
                                        <p className="font-medium">Browse all available badges</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Badge Browser Panel */}
                        {showBadgePanel && (
                            <div className="relative mt-2 rounded-lg border-2 border-blue-400 bg-white shadow-lg">
                                <div className="sticky top-0 flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                                    <div>
                                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
                                            <IdCard className="h-4 w-4" />
                                            Available Badges ({availableBadges.length})
                                        </h4>
                                        <p className="text-xs text-blue-700 mt-0.5">Click a badge to assign</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-blue-200"
                                        onClick={() => setShowBadgePanel(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="max-h-[280px] overflow-y-auto p-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableBadges.map((badge) => (
                                            <button
                                                key={badge.id}
                                                type="button"
                                                onClick={() => handleBadgeSelectFromPanel(badge)}
                                                className={cn(
                                                    'relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md',
                                                    selectedBadge?.id === badge.id
                                                        ? 'border-green-500 bg-green-50 shadow-md'
                                                        : 'border-gray-200 bg-white'
                                                )}
                                            >
                                                {selectedBadge?.id === badge.id && (
                                                    <div className="absolute -right-1 -top-1 rounded-full bg-green-500 p-0.5 shadow-sm">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <IdCard className={cn(
                                                    'h-7 w-7 mb-1.5',
                                                    selectedBadge?.id === badge.id ? 'text-green-600' : 'text-gray-400'
                                                )} />
                                                <span className={cn(
                                                    'text-sm font-bold',
                                                    selectedBadge?.id === badge.id ? 'text-green-700' : 'text-gray-700'
                                                )}>
                                                    {badge.badge_number}
                                                </span>
                                                {badge.location && (
                                                    <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0">
                                                        {badge.location}
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {availableBadges.length === 0 && (
                                        <div className="py-8 text-center text-sm text-gray-500">
                                            <IdCard className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                            No badges available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Selected Badge Display */}
                        {selectedBadge && (
                            <div className="flex items-center gap-2.5 rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="rounded-full bg-emerald-500 p-1">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                                <IdCard className="h-4.5 w-4.5 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-800">
                                    Badge #{selectedBadge.badge_number} selected
                                </span>
                                {selectedBadge.location && (
                                    <Badge variant="outline" className="ml-auto text-xs bg-white border-emerald-300 text-emerald-700">
                                        {selectedBadge.location}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {errors.selected_badge_id && (
                            <p className="flex items-center gap-1.5 rounded-md bg-red-50 p-2.5 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.selected_badge_id}
                            </p>
                        )}

                        {availableBadges.length === 0 && (
                            <p className="flex items-center gap-1.5 rounded-md bg-amber-50 p-2.5 text-sm font-medium text-amber-700">
                                <AlertCircle className="h-4 w-4" />
                                No badges available. Please check badge inventory.
                            </p>
                        )}

                        {badgeInput && filteredBadges.length === 0 && availableBadges.length > 0 && (
                            <p className="flex items-center gap-1.5 rounded-md bg-blue-50 p-2.5 text-sm text-blue-700">
                                <AlertCircle className="h-4 w-4" />
                                No badges found matching "{badgeInput}". Click the grid icon to browse all badges.
                            </p>
                        )}
                    </div>

                    {/* Enhanced Validation Notes */}
                    <div className="space-y-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/50 to-slate-50/30 p-5">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-slate-100 p-1.5">
                                <FileText className="h-4 w-4 text-slate-600" />
                            </div>
                            <Label htmlFor="notes" className="text-base font-semibold text-gray-800">
                                Validation Notes <span className="text-sm font-normal text-gray-500">(Optional)</span>
                            </Label>
                        </div>
                        <Textarea
                            id="notes"
                            className={cn(
                                'min-h-[80px] resize-none transition-all',
                                errors.validation_notes
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            )}
                            placeholder="Add any additional notes about the validation process (e.g., special instructions, observations, or concerns)..."
                            value={formData.validation_notes}
                            onChange={(e) => handleInputChange('validation_notes', e.target.value)}
                            rows={3}
                        />
                        {errors.validation_notes && (
                            <p className="flex items-center gap-1.5 rounded-md bg-red-50 p-2.5 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.validation_notes}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            type="button"
                            disabled={isDenying || isSubmitting}
                            variant="destructive"
                            onClick={handleDeny}
                            className="h-11 font-semibold shadow-sm transition-all hover:shadow-md"
                        >
                            {isDenying ? (
                                <span className="flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Denying...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <X className="h-4 w-4" />
                                    Deny
                                </span>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting || isDenying}
                            className="h-11 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isDenying || availableBadges.length === 0}
                            className="h-11 bg-gradient-to-r from-green-600 to-emerald-600 font-semibold shadow-sm transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-md"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Validating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Validate & Assign Badge
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
