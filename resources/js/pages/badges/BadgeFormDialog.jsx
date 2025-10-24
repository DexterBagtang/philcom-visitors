import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VirtualKeyboard from '@/components/VirtualKeyboard';
import { useForm } from '@inertiajs/react';
import { Keyboard as KeyboardIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BadgeFormDialog({ badge, isOpen, onOpenChange }) {
    const isEdit = badge !== null;
    const [showKeyboard, setShowKeyboard] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        badge_number: '',
        status: 'available',
        location: 'Lobby',
    });

    useEffect(() => {
        if (isOpen && badge) {
            setData({
                badge_number: badge.badge_number || '',
                status: badge.status || 'available',
                location: badge.location || 'Lobby',
            });
        } else if (isOpen && !badge) {
            reset();
        }
        // Hide keyboard by default when dialog opens
        if (isOpen) {
            setShowKeyboard(false);
        }
    }, [isOpen, badge]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(`/badges/${badge.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                    toast.success('Badge edited');
                },
            });
        } else {
            post('/badges', {
                onSuccess: () => {
                    // onOpenChange(false);
                    reset();
                    toast.success('Badge added');
                },
            });
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        reset();
    };

    // Keyboard change handler
    const handleKeyboardChange = (input) => {
        setData('badge_number', input);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {isEdit ? 'Edit Badge' : 'Add New Badge'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="badge_number" className="text-sm font-medium">
                                    Badge Number
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowKeyboard(!showKeyboard)}
                                    className="h-8 gap-2"
                                >
                                    <KeyboardIcon className="h-4 w-4" />
                                    {showKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
                                </Button>
                            </div>
                            <Input
                                id="badge_number"
                                type="text"
                                placeholder="Enter badge number"
                                value={data.badge_number}
                                onChange={(e) => setData('badge_number', e.target.value)}
                                className={errors.badge_number ? 'border-red-500' : ''}
                                autoComplete="off"
                            />
                            {errors.badge_number && (
                                <span className="text-sm text-red-500">{errors.badge_number}</span>
                            )}
                        </div>

                        {/* Virtual Keyboard Component */}
                        <VirtualKeyboard
                            value={data.badge_number}
                            onChange={handleKeyboardChange}
                            visible={showKeyboard}
                            placeholder="Click 'Show Keyboard' to use virtual keyboard"
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="status" className="text-sm font-medium">
                                Status
                            </Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                            >
                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <span className="text-sm text-red-500">{errors.status}</span>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location" className="text-sm font-medium">
                                Location
                            </Label>
                            <Input
                                id="location"
                                type="text"
                                value="Lobby"
                                disabled
                                className="bg-gray-50 text-gray-600"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 space-x-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Update Badge' : 'Create Badge'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
