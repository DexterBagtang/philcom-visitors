import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { AlertCircle, Building, Check, Clock, FileText, IdCard, Loader, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ValidationDialog({ isOpen, onClose, visitor, visit, onSuccess, availableBadges = [] }) {
    const [formData, setFormData] = useState({
        id_type_checked: '',
        id_number_checked: '',
        validation_notes: '',
        selected_badge_id: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDenying, setIsDenying] = useState(false);
    const [errors, setErrors] = useState({});
    const [badgeInput, setBadgeInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const idTypes = ['National ID', 'Passport', "Driver's License", 'Company ID', 'Student ID', 'Other'];

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    // Filter badges based on input
    const filteredBadges = availableBadges.filter((badge) => badge.badge_number.toLowerCase().includes(badgeInput.toLowerCase()));

    const handleBadgeInputChange = (value) => {
        setBadgeInput(value);
        setShowSuggestions(value.length > 0);

        // Clear selection if input doesn't match any badge
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

    const selectedBadge = availableBadges.find((badge) => badge.id.toString() === formData.selected_badge_id);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.id_type_checked) {
            newErrors.id_type_checked = 'ID type is required';
        }

        if (!formData.id_number_checked.trim()) {
            newErrors.id_number_checked = 'ID number is required';
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
                    preserveState:true,
                    preserveScroll:true,
                    onSuccess: () => {
                        // Show success toast with visitor and badge details
                        toast.success('Visitor validated successfully', {
                            description: `${visitor?.name} has been validated and assigned badge #${selectedBadge?.badge_number}. Visit is now active.`,
                            duration: 4000,
                        });
                        // onSuccess?.();
                        onClose();
                        setFormData({
                            id_type_checked: '',
                            id_number_checked: '',
                            validation_notes: '',
                            selected_badge_id: '',
                        });
                        setErrors({});
                    },
                    onError: (errors) => {
                        setErrors(errors);

                        // Show error toast
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

            // Show error toast for unexpected errors
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
    }

    const handleDeny = (e) => {
        e.preventDefault();

        if (!validateDenyForm()) return;

        setIsDenying(true);

        router.post(route('visits.deny',visit.id),{...formData},{
            preserveState:true,
            preserveScroll:true,
            onSuccess: () => {
                // Show success toast with visitor and badge details
                toast.warning('Visitor Denied', {
                    description: `${visitor?.name} has been denied`,
                    duration: 4000,
                });
            },
            onError: (errors) => {
                setErrors(errors);

                // Show error toast
                toast.error('Validation failed', {
                    description: errors.message || 'There was an error validating the visitor. Please check the form and try again.',
                    duration: 4000,
                });
            },
            onFinish: () => {
                setIsDenying(false);
                handleClose();
            },
        })
    };

    if (!visitor || !visit) return null;

    // Reset function to clear all states
    const resetDialog = () => {
        setFormData({
            id_type_checked: '',
            id_number_checked: '',
            validation_notes: '',
            selected_badge_id: '',
        });
        setErrors({});
        setBadgeInput('');
        setShowSuggestions(false);
    };

    // Handle dialog close with reset
    const handleClose = () => {
        resetDialog();
        onClose();
    };


    return (
        <Dialog open={isOpen} onOpenChange={handleClose} >
            <DialogContent className="sm:max-w-[600px]" onInteractOutside={e=>e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IdCard className="h-5 w-5" />
                        Validate Visitor
                    </DialogTitle>
                    <DialogDescription>Please verify the visitor's identity and assign a badge to complete the check-in process.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Visitor Information Display */}
                    <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Visitor Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{visitor.name}</p>
                                    <p className="text-xs text-gray-500">Name</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{visitor.company}</p>
                                    <p className="text-xs text-gray-500">Company</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <IdCard className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{visitor.type}</p>
                                    <p className="text-xs text-gray-500">Type</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{new Date(visit.check_in_time).toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Check-in Time</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{visitor.person_to_visit}</p>
                                    <p className="text-xs text-gray-500">Visiting</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">{visitor.visit_purpose}</p>
                                    <p className="text-xs text-gray-500">Purpose of Visit</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ID Verification Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700">ID Verification</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id_type">ID Type *</Label>
                                <Select value={formData.id_type_checked} onValueChange={(value) => handleInputChange('id_type_checked', value)}>
                                    <SelectTrigger className={errors.id_type_checked ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {idTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.id_type_checked && (
                                    <p className="flex items-center gap-1 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.id_type_checked}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="id_number">ID Number *</Label>
                                <Input
                                    id="id_number"
                                    placeholder="Enter ID number"
                                    value={formData.id_number_checked}
                                    onChange={(e) => handleInputChange('id_number_checked', e.target.value)}
                                    className={errors.id_number_checked ? 'border-red-500' : ''}
                                />
                                {errors.id_number_checked && (
                                    <p className="flex items-center gap-1 text-sm text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.id_number_checked}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Badge Assignment Section */}
                    <div className="space-y-2">
                        <Label htmlFor="badge-input">Assign Badge *</Label>

                        <div className="relative">
                            <Input
                                id="badge-input"
                                placeholder="Type badge number (e.g., 001, B-123)"
                                value={badgeInput}
                                onChange={(e) => handleBadgeInputChange(e.target.value)}
                                onFocus={() => setShowSuggestions(badgeInput.length > 0)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className={cn(errors.selected_badge_id && 'border-red-500')}
                            />

                            {/* Suggestions Dropdown */}
                            {showSuggestions && filteredBadges.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                                    {filteredBadges.slice(0, 8).map((badge) => (
                                        <div
                                            key={badge.id}
                                            onClick={() => handleSuggestionSelect(badge)}
                                            className="flex cursor-pointer items-center justify-between border-b p-2 last:border-b-0 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-2">
                                                {selectedBadge?.id === badge.id && <Check className="h-3 w-3 text-green-600" />}
                                                <span className="text-sm font-medium">Badge #{badge.badge_number}</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {badge.location || 'Available'}
                                            </Badge>
                                        </div>
                                    ))}
                                    {filteredBadges.length > 8 && (
                                        <div className="border-t p-2 text-center text-xs text-gray-500">
                                            {filteredBadges.length - 8} more badges available...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Badge Display */}
                        {selectedBadge && (
                            <div className="flex items-center space-x-2 rounded border border-green-200 bg-green-50 p-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-800">Badge #{selectedBadge.badge_number} selected</span>
                                <Badge variant="outline" className="text-xs">
                                    {selectedBadge.location || 'Available'}
                                </Badge>
                            </div>
                        )}

                        {errors.selected_badge_id && (
                            <p className="flex items-center gap-1 text-sm text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {errors.selected_badge_id}
                            </p>
                        )}

                        {availableBadges.length === 0 && (
                            <p className="flex items-center gap-1 text-sm text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                No badges available. Please check badge inventory.
                            </p>
                        )}

                        {badgeInput && filteredBadges.length === 0 && availableBadges.length > 0 && (
                            <p className="flex items-center gap-1 text-sm text-gray-500">
                                <AlertCircle className="h-3 w-3" />
                                No badges found matching "{badgeInput}". Available badges: {availableBadges.map((b) => b.badge_number).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Validation Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Validation Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            className={errors.validation_notes ? 'border-red-500' : ''}
                            placeholder="Add any additional notes about the validation process..."
                            value={formData.validation_notes}
                            onChange={(e) => handleInputChange('validation_notes', e.target.value)}
                            rows={3}
                        />
                        {errors.validation_notes && (
                            <p className="flex items-center gap-1 text-sm text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {errors.validation_notes}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" disabled={isDenying || isSubmitting} variant="destructive" onClick={handleDeny}>
                            {isDenying ? (
                                <span className="flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Denying...
                                </span>
                            ) : (
                                'Deny'
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || isDenying}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isDenying || availableBadges.length === 0} className="bg-green-600 hover:bg-green-700">
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Validating...
                                </span>
                            ) : (
                                'Validate & Assign Badge'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
