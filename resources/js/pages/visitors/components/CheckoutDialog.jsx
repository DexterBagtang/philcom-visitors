import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, IdCard, FileText } from "lucide-react";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export default function CheckoutDialog({ isOpen, onClose, visit, onSuccess }) {
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!visit) return null;

    const handleConfirm = () => {
        setIsLoading(true);
        router.post(
            route("visits.checkout", visit.id),
            { notes },
            {
                preserveState :true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsLoading(false);
                    setNotes("");

                    // Show success toast with visitor name
                    toast.success("Visitor checked out successfully", {
                        description: `${visit.visitor?.name} has been checked out${visit.current_badge_assignment?.badge ? ` and badge #${visit.current_badge_assignment.badge.badge_number} is now available` : ''}.`,
                        duration: 4000,
                    });

                    // onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    setIsLoading(false);

                    // Show error toast
                    toast.error("Checkout failed", {
                        description: errors.message || "There was an error checking out the visitor. Please try again.",
                        duration: 4000,
                    });
                }
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <IdCard className="h-5 w-5 text-destructive" />
                        Confirm Visitor Checkout
                    </DialogTitle>
                    <DialogDescription>
                        Please review the visitor details before confirming checkout.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Visitor Name */}
                    <div className="p-3 rounded-md bg-gray-50 border flex items-center gap-3">
                        <User className="text-gray-500 h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground">Visitor Name</p>
                            <p className="text-lg font-semibold">{visit.visitor?.name}</p>
                        </div>
                    </div>

                    {/* Badge */}
                    {visit.current_badge_assignment?.badge && (
                        <div className="p-3 rounded-md bg-gray-50 border flex items-center gap-3">
                            <IdCard className="text-gray-500 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Assigned Badge</p>
                                <p className="text-lg font-semibold">
                                    #{visit.current_badge_assignment.badge.badge_number}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Checkout Notes (optional)
                        </label>
                        <Textarea
                            placeholder="Add any remarks..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Checkout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
