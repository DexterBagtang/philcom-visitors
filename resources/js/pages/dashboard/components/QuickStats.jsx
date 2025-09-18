'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Calendar as CalendarIcon, Clock, UserCheck, Users } from "lucide-react";
import { format } from "date-fns";

export default function QuickStats({ visitors, activeFilter, onFilterChange }) {
    // Stats
    const currentlyInside = visitors.filter((v) => v.status === "ongoing").length;
    const checkedOutToday = visitors.filter((v) => v.status === "checked_out").length;
    const pendingValidation = visitors.filter((v) => v.status === "checked_in").length;

    const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

    // Filters
    const filterOptions = [
        {
            id: "ongoing",
            count: currentlyInside,
            title: "Ongoing Visit",
            description: "Visitors inside",
            icon: UserCheck,
            color: "text-green-600 bg-green-100",
        },
        {
            id: "checked_out",
            count: checkedOutToday,
            title: "Checked Out Today",
            description: "Completed visits",
            icon: Clock,
            color: "text-blue-600 bg-blue-100",
        },
        {
            id: "checked_in",
            count: pendingValidation,
            title: "Pending Validation",
            description: "Awaiting ID check",
            icon: AlertTriangle,
            color: "text-amber-600 bg-amber-100",
        },
        {
            id: "all",
            count: visitors.length,
            title: "Total Visitors",
            description: "All time",
            icon: Users,
            color: "text-slate-600 bg-slate-100",
            noFilter: true,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between my-4 px-2">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Today's Visitors</h2>
                </div>
                <p className="text-sm ">{currentDate}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filterOptions.map((filter) => (
                    <Card
                        key={filter.id}
                        className={cn(
                            "group relative rounded-xl border shadow-sm transition-all hover:shadow-md",
                            !filter.noFilter && activeFilter === filter.id
                                ? "border-blue-500 bg-blue-50/60"
                                : "hover:border-blue-300 hover:bg-blue-50/30",
                            filter.noFilter ? "" : "cursor-pointer"
                        )}
                        onClick={() => {
                            if (!filter.noFilter) {
                                onFilterChange(filter.id === activeFilter ? null : filter.id);
                            }
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {filter.title}
                            </CardTitle>
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full",
                                    filter.color
                                )}
                            >
                                <filter.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filter.count}</div>
                            <p className="text-xs text-muted-foreground">
                                {filter.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
