'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Calendar as CalendarIcon, Clock, UserCheck, Users, UserCog } from "lucide-react";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


export default function QuickStats({ visitors = [], activeFilter, onFilterChange }) {
    // Ensure visitors is an array
    const visitorsList = Array.isArray(visitors) ? visitors : [];

    // Stats
    const currentlyInside = visitorsList.filter((v) => v.status === "ongoing").length;
    const checkedOutToday = visitorsList.filter((v) => v.status === "checked_out").length;
    const pendingValidation = visitorsList.filter((v) => v.status === "checked_in").length;

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
            count: visitorsList.length,
            title: "Total Visitors",
            description: "All time",
            icon: Users,
            color: "text-slate-600 bg-slate-100",
            noFilter: true,
        },
    ];

    // Calculate visitor types breakdown
    const visitorTypeStats = visitorsList.reduce((acc, visitor) => {
        const type = visitor.visitor.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    console.log(visitorTypeStats);

    // Get top 3 visitor types
    const topVisitorTypes = Object.entries(visitorTypeStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Get remaining visitor types (after top 3)
    const remainingVisitorTypes = Object.entries(visitorTypeStats)
        .sort(([, a], [, b]) => b - a)
        .slice(3);

    // Define visitor type colors - dot colors
    const getVisitorTypeColor = (type) => {
        const colors = {
            'Contractor': 'bg-blue-500',
            'Guest': 'bg-green-500',
            'Delivery': 'bg-amber-500',
            'Maintenance': 'bg-purple-500',
            'Supplier': 'bg-indigo-500',
            'Client': 'bg-pink-500',
            'Applicant': 'bg-teal-500',
            'Unknown': 'bg-slate-500'
        };
        return colors[type] || 'bg-slate-500';
    };

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

                {/* Visitor Types Breakdown Card */}
                <Card className="group relative rounded-xl border shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Visitor Types
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            <UserCog className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {topVisitorTypes.length > 0 ? (
                            <>
                                <div className="text-2xl font-bold text-slate-900">
                                    {Object.keys(visitorTypeStats).length}
                                </div>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    {topVisitorTypes.map(([type, count]) => (
                                        <div key={type} className="flex items-center gap-1">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                getVisitorTypeColor(type)
                                            )} />
                                            <span className="text-xs text-slate-600">
                                                {type} ({count})
                                            </span>
                                        </div>
                                    ))}
                                    {remainingVisitorTypes.length > 0 && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-xs text-slate-500 cursor-help hover:text-slate-700 transition-colors">
                                                        +{remainingVisitorTypes.length}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="max-w-xs bg-white border border-slate-200 shadow-lg">
                                                    <div className="space-y-1 p-1">
                                                        <p className="text-xs font-semibold text-slate-900 mb-2">Other Visitor Types:</p>
                                                        {remainingVisitorTypes.map(([type, count]) => (
                                                            <div key={type} className="flex items-center gap-2 justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={cn(
                                                                        "h-2 w-2 rounded-full flex-shrink-0",
                                                                        getVisitorTypeColor(type)
                                                                    )} />
                                                                    <span className="text-xs text-slate-700">{type}</span>
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-900">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-slate-900">0</div>
                                <p className="text-xs text-muted-foreground">No visitor types</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
