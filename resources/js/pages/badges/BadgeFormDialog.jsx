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
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function BadgeFormDialog({ badge, isOpen, onOpenChange }) {
    const isEdit = badge !== null;

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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {isEdit ? 'Edit Badge' : 'Add New Badge'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="badge_number" className="text-sm font-medium">
                                Badge Number
                            </Label>
                            <Input
                                id="badge_number"
                                type="text"
                                placeholder="Enter badge number"
                                value={data.badge_number}
                                onChange={(e) => setData('badge_number', e.target.value)}
                                className={errors.badge_number ? 'border-red-500' : ''}
                            />
                            {errors.badge_number && (
                                <span className="text-sm text-red-500">{errors.badge_number}</span>
                            )}
                        </div>

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
