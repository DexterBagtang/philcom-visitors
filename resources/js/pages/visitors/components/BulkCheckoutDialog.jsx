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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, IdCard, FileText, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export default function BulkCheckoutDialog({ isOpen, onClose, selectedVisits = [], onSuccess }) {
    const [notes, setNotes] = useState("Bulk checkout - visitor left without formal checkout");
    const [isLoading, setIsLoading] = useState(false);

    if (!selectedVisits.length) return null;

    const handleConfirm = () => {
        setIsLoading(true);
        const visitIds = selectedVisits.map(v => v.id);

        router.post(
            route("visits.bulk-checkout"),
            {
                visit_ids: visitIds,
                notes
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsLoading(false);
                    setNotes("Bulk checkout - visitor left without formal checkout");

                    toast.success("Bulk checkout completed", {
                        description: `${selectedVisits.length} visitor(s) have been checked out successfully.`,
                        duration: 4000,
                    });

                    onSuccess?.();
                    onClose();
                },
                onError: (errors) => {
                    setIsLoading(false);

                    toast.error("Bulk checkout failed", {
                        description: errors.general || "There was an error during bulk checkout. Please try again.",
                        duration: 4000,
                    });
                }
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg" onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-destructive" />
                        Bulk Checkout Visitors
                    </DialogTitle>
                    <DialogDescription>
                        You are about to checkout {selectedVisits.length} visitor{selectedVisits.length > 1 ? 's' : ''}.
                        This action will release their badges and mark their visits as completed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning Banner */}
                    <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Overdue Visitors</p>
                            <p className="text-amber-700">
                                These visitors have been on premises for an extended period.
                                Please ensure they have actually left before checking them out.
                            </p>
                        </div>
                    </div>

                    {/* Selected Visitors List */}
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            Selected Visitors ({selectedVisits.length})
                        </label>
                        <ScrollArea className="h-[200px] rounded-md border">
                            <div className="p-3 space-y-2">
                                {selectedVisits.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="p-2 rounded-md bg-gray-50 border flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                                                {visit.visitor?.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{visit.visitor?.name}</p>
                                                <p className="text-xs text-muted-foreground">{visit.visitor?.company || 'No company'}</p>
                                            </div>
                                        </div>
                                        {visit.current_badge_assignment?.badge && (
                                            <Badge variant="outline" className="text-xs">
                                                <IdCard className="h-3 w-3 mr-1" />
                                                #{visit.current_badge_assignment.badge.badge_number}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Checkout Notes
                        </label>
                        <Textarea
                            placeholder="Add any remarks..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
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
                        Checkout {selectedVisits.length} Visitor{selectedVisits.length > 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}