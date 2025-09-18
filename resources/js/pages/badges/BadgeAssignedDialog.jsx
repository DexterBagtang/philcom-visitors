import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Building2,
    IdCard,
    ClipboardCheck,
    CalendarClock,
    FileText,
    ShieldCheck,
    MapPin,
} from "lucide-react";

export default function BadgeAssignedDialog({ badge, isOpen, onOpenChange }) {
    if (!badge) return null;

    const assignment = badge.current_assignment;
    const visit = assignment?.visit;
    const visitor = visit?.visitor;

    // Badge status color
    const statusColor =
        badge.status === "assigned"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800";

    // Visit status color
    const visitStatusColor =
        visit?.status === "ongoing"
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800";

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-6 bg-white rounded-lg shadow-lg">
                <DialogHeader className="mb-6">
                    <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                        <IdCard className="w-5 h-5 text-gray-600" />
                        Badge Details
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        Details for badge{" "}
                        <span className="font-semibold text-gray-700">{badge.badge_number}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Badge Info */}
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                            <MapPin className="w-4 h-4" />
                            Badge Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Number:</span>{" "}
                                <span className="text-gray-900 truncate" title={badge.badge_number}>
                                    {badge.badge_number}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>{" "}
                                <Badge className={`${statusColor} px-2 py-0.5 text-xs font-medium`}>
                                    {badge.status}
                                </Badge>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Location:</span>{" "}
                                <span className="text-gray-900 truncate" title={badge.location}>
                                    {badge.location}
                                </span>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-gray-200" />

                    {/* Visitor Info */}
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                            <User className="w-4 h-4" />
                            Visitor Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Name:</span>{" "}
                                <span className="text-gray-900 truncate" title={visitor?.name}>
                                    {visitor?.name}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Type:</span>{" "}
                                <span className="text-gray-900 truncate" title={visitor?.type}>
                                    {visitor?.type}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700 flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    Company:
                                </span>{" "}
                                <span className="text-gray-900 truncate" title={visitor?.company}>
                                    {visitor?.company}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Visit Purpose:</span>{" "}
                                <span
                                    className="text-gray-900 truncate"
                                    title={`${visitor?.visit_purpose} (to ${visitor?.person_to_visit})`}
                                >
                                    {visitor?.visit_purpose} (to {visitor?.person_to_visit})
                                </span>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-gray-200" />

                    {/* Visit Info */}
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                            <ClipboardCheck className="w-4 h-4" />
                            Visit Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Status:</span>{" "}
                                <Badge className={`${visitStatusColor} px-2 py-0.5 text-xs font-medium`}>
                                    {visit?.status}
                                </Badge>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700 flex items-center gap-1">
                                    <CalendarClock className="w-4 h-4" />
                                    Check-in:
                                </span>{" "}
                                <span className="text-gray-900 truncate" title={new Date(visit?.check_in_time).toLocaleString()}>
                                    {new Date(visit?.check_in_time).toLocaleString()}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Validated By:</span>{" "}
                                <span className="text-gray-900 truncate" title={visit?.validated_by}>
                                    {visit?.validated_by}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    ID Checked:
                                </span>{" "}
                                <span
                                    className="text-gray-900 truncate"
                                    title={`${visit?.id_type_checked} (${visit?.id_number_checked})`}
                                >
                                    {visit?.id_type_checked} ({visit?.id_number_checked})
                                </span>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-gray-200" />

                    {/* Assignment Info */}
                    <section className="space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                            <FileText className="w-4 h-4" />
                            Assignment Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Assigned At:</span>{" "}
                                <span className="text-gray-900 truncate" title={new Date(assignment?.assigned_at).toLocaleString()}>
                                    {new Date(assignment?.assigned_at).toLocaleString()}
                                </span>
                            </div>
                            {assignment?.notes && (
                                <div>
                                    <span className="font-medium text-gray-700">Notes:</span>{" "}
                                    <span className="text-gray-900 truncate" title={assignment.notes}>
                                        {assignment.notes}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
