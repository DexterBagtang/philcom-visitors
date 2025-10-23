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
            color: "text-emerald-600 bg-emerald-100",
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            gradientFrom: "from-emerald-50",
            gradientTo: "to-emerald-100/50",
            ringColor: "ring-emerald-200",
            hoverBg: "hover:bg-emerald-50/50",
            activeBg: "bg-emerald-50/80",
            activeBorder: "border-emerald-400",
            activeRing: "ring-2 ring-emerald-300",
            defaultBorder: "border-emerald-200",
            glowShadow: "shadow-emerald-100",
        },
        {
            id: "checked_out",
            count: checkedOutToday,
            title: "Checked Out Today",
            description: "Completed visits",
            icon: Clock,
            color: "text-blue-600 bg-blue-100",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            gradientFrom: "from-blue-50",
            gradientTo: "to-blue-100/50",
            ringColor: "ring-blue-200",
            hoverBg: "hover:bg-blue-50/50",
            activeBg: "bg-blue-50/80",
            activeBorder: "border-blue-400",
            activeRing: "ring-2 ring-blue-300",
            defaultBorder: "border-blue-200",
            glowShadow: "shadow-blue-100",
        },
        {
            id: "checked_in",
            count: pendingValidation,
            title: "Pending Validation",
            description: "Awaiting ID check",
            icon: AlertTriangle,
            color: "text-amber-600 bg-amber-100",
            iconBg: "bg-amber-100",
            iconText: "text-amber-600",
            gradientFrom: "from-amber-50",
            gradientTo: "to-amber-100/50",
            ringColor: "ring-amber-200",
            hoverBg: "hover:bg-amber-50/50",
            activeBg: "bg-amber-50/80",
            activeBorder: "border-amber-400",
            activeRing: "ring-2 ring-amber-300",
            defaultBorder: "border-amber-200",
            glowShadow: "shadow-amber-100",
            pulse: pendingValidation > 0,
        },
        {
            id: "all",
            count: visitorsList.length,
            title: "Total Visitors",
            description: "All time",
            icon: Users,
            color: "text-slate-600 bg-slate-100",
            iconBg: "bg-slate-100",
            iconText: "text-slate-600",
            gradientFrom: "from-slate-50",
            gradientTo: "to-slate-100/50",
            defaultBorder: "border-slate-200",
            glowShadow: "shadow-slate-100",
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
                {filterOptions.map((filter) => {
                    const isActive = !filter.noFilter && activeFilter === filter.id;
                    
                    return (
                        <Card
                            key={filter.id}
                            className={cn(
                                "group relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                !filter.noFilter && "cursor-pointer",
                                // Default state - colored borders and subtle glow
                                !isActive && filter.defaultBorder,
                                !isActive && "shadow-md",
                                !isActive && filter.glowShadow,
                                // Active state
                                isActive && [
                                    filter.activeBorder,
                                    filter.activeRing,
                                    "shadow-lg",
                                    "scale-[1.02]"
                                ],
                                // Hover state
                                !isActive && !filter.noFilter && [
                                    "hover:border-opacity-80",
                                    filter.hoverBg,
                                    "hover:shadow-lg",
                                    "hover:scale-[1.01]",
                                    "hover:-translate-y-0.5"
                                ]
                            )}
                            onClick={() => {
                                if (!filter.noFilter) {
                                    onFilterChange(filter.id === activeFilter ? null : filter.id);
                                }
                            }}
                        >
                            {/* Gradient Background - always visible but subtle */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                                filter.gradientFrom,
                                filter.gradientTo,
                                isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                            )} />
                            
                            {/* Pulse animation for pending validation */}
                            {filter.pulse && filter.count > 0 && (
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-lg"></span>
                                    </span>
                                </div>
                            )}

                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>

                            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                                <CardTitle className={cn(
                                    "text-sm font-semibold transition-colors",
                                    isActive && "font-bold"
                                )}>
                                    {filter.title}
                                </CardTitle>
                                <div
                                    className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 shadow-md",
                                        filter.iconBg,
                                        filter.iconText,
                                        isActive && "scale-110 shadow-lg ring-2 ring-white"
                                    )}
                                >
                                    <filter.icon className={cn(
                                        "h-5 w-5 transition-all",
                                        isActive && "h-6 w-6"
                                    )} />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                <div className={cn(
                                    "text-3xl font-bold transition-all duration-300",
                                    isActive && "text-4xl"
                                )}>
                                    {filter.count}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                    {filter.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Visitor Types Breakdown Card */}
                <Card className="group relative rounded-xl border-2 border-purple-200 shadow-md shadow-purple-100 transition-all duration-300 hover:shadow-lg hover:border-purple-300 hover:scale-[1.01] hover:-translate-y-0.5 overflow-hidden">
                    {/* Gradient Background - always visible */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
                    
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>

                    <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Visitor Types
                        </CardTitle>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-600 transition-all duration-300 shadow-md group-hover:scale-110 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-white">
                            <UserCog className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        {topVisitorTypes.length > 0 ? (
                            <>
                                <div className="text-3xl font-bold text-slate-900">
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
                                <div className="text-3xl font-bold text-slate-900">0</div>
                                <p className="text-xs text-muted-foreground font-medium">No visitor types</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
