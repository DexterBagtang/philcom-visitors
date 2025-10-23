import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, TrendingUp, UserCheck, Target, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VisitorInsights({ className }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const response = await fetch(route('visitors.insights'));
            const result = await response.json();
            if (result.success) {
                setInsights(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="animate-pulse border-slate-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-4 w-32 rounded bg-slate-200"></div>
                        <div className="flex flex-1 gap-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 flex-1 rounded bg-slate-100"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!insights) {
        return null;
    }

    const insightCards = [
        {
            title: 'Top Company',
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            data: insights.topCompanies,
            labelKey: 'company',
            emptyMessage: 'No data',
        },
        {
            title: 'Top Visitor',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            data: insights.topVisitors,
            labelKey: 'name',
            subtitle: 'company',
            emptyMessage: 'No data',
        },
        {
            title: 'Top Host',
            icon: UserCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            data: insights.topHosts,
            labelKey: 'host',
            emptyMessage: 'No data',
        },
        {
            title: 'Top Purpose',
            icon: Target,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            data: insights.topPurposes,
            labelKey: 'purpose',
            emptyMessage: 'No data',
        },
        {
            title: 'Top Visitor Type',
            icon: Users,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            data: insights.topTypes,
            labelKey: 'type',
            emptyMessage: 'No data',
        },
    ];

    return (
        <Card className={cn('border-slate-200 shadow-sm', className)}>
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-slate-700">Quick Insights</h3>
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
                                {insights.totalVisits} visits (Last 30 days)
                            </Badge>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="h-3 w-3" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3" />
                                    Show More
                                </>
                            )}
                        </button>
                    </div>

                    {/* Compact Insights Grid */}
                    <div className="grid grid-cols-5 gap-3">
                        <TooltipProvider delayDuration={200}>
                            {insightCards.map((card, index) => {
                                const Icon = card.icon;
                                const topItem = card.data && card.data.length > 0 ? card.data[0] : null;
                                const hasData = topItem !== null;

                                return (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    'group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-md',
                                                    card.borderColor,
                                                    card.bgColor,
                                                    'cursor-help',
                                                )}
                                            >
                                                {/* Icon Header */}
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Icon className={cn('h-4 w-4', card.color)} />
                                                    <span className="text-xs font-medium text-slate-600">{card.title}</span>
                                                </div>

                                                {/* Top Item */}
                                                {hasData ? (
                                                    <div className="space-y-1">
                                                        <p className="truncate text-sm font-semibold text-slate-900" title={topItem[card.labelKey]}>
                                                            {topItem[card.labelKey]}
                                                        </p>
                                                        {card.subtitle && topItem[card.subtitle] && (
                                                            <p className="truncate text-xs text-slate-500" title={topItem[card.subtitle]}>
                                                                {topItem[card.subtitle]}
                                                            </p>
                                                        )}
                                                        <Badge variant="secondary" className="text-xs font-semibold">
                                                            {topItem.count} visit{topItem.count !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400">{card.emptyMessage}</p>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-sm border border-slate-200 bg-white p-0 shadow-lg">
                                            <div className="overflow-hidden rounded-lg">
                                                {/* Header */}
                                                <div className={cn("px-4 py-3 border-b border-slate-100", card.bgColor)}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={cn('h-4 w-4', card.color)} />
                                                        <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>
                                                        <Badge variant="secondary" className="ml-auto text-xs">
                                                            Top 5
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-3">
                                                    {card.data && card.data.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {card.data.slice(0, 5).map((item, idx) => {
                                                                const percentage = (item.count / card.data[0].count) * 100;
                                                                const isTop = idx === 0;

                                                                return (
                                                                    <div key={idx} className="group relative">
                                                                        {/* Background bar */}
                                                                        <div
                                                                            className={cn(
                                                                                "absolute inset-0 rounded-md transition-all duration-300",
                                                                                card.bgColor,
                                                                                "opacity-0 group-hover:opacity-100"
                                                                            )}
                                                                            style={{ width: `${percentage}%` }}
                                                                        />

                                                                        {/* Content */}
                                                                        <div className="relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-slate-50">
                                                                            {/* Rank badge */}
                                                                            <div className={cn(
                                                                                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                                                                                isTop ? cn(card.color, card.bgColor, "ring-2 ring-offset-1", card.borderColor.replace('border-', 'ring-')) : "bg-slate-100 text-slate-600"
                                                                            )}>
                                                                                {idx + 1}
                                                                            </div>

                                                                            {/* Info */}
                                                                            <div className="flex min-w-0 flex-1 flex-col">
                                                                                <span className="truncate text-sm font-medium text-slate-900">
                                                                                    {item[card.labelKey]}
                                                                                </span>
                                                                                {card.subtitle && item[card.subtitle] && (
                                                                                    <span className="truncate text-xs text-slate-500">
                                                                                        {item[card.subtitle]}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Count badge */}
                                                                            <div className="flex flex-col items-end gap-0.5">
                                                                                <Badge
                                                                                    variant={isTop ? "default" : "secondary"}
                                                                                    className={cn(
                                                                                        "text-xs font-bold",
                                                                                        isTop && cn(card.color, card.bgColor, "border", card.borderColor)
                                                                                    )}
                                                                                >
                                                                                    {item.count}
                                                                                </Badge>
                                                                                <span className="text-[10px] font-medium text-slate-400">
                                                                                    {percentage.toFixed(0)}%
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                                            <Icon className="mb-2 h-8 w-8 text-slate-300" />
                                                            <p className="text-xs font-medium text-slate-500">No data available</p>
                                                            <p className="mt-1 text-xs text-slate-400">Check back later for insights</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                        <div className="grid grid-cols-5 gap-3 border-t border-slate-200 pt-3">
                            {insightCards.map((card, index) => {
                                const hasData = card.data && card.data.length > 0;

                                return (
                                    <div key={index} className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-700">{card.title} Details</p>
                                        {hasData ? (
                                            <div className="space-y-1.5">
                                                {card.data.slice(0, 5).map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white p-2 text-xs"
                                                    >
                                                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                                            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-medium text-slate-900" title={item[card.labelKey]}>
                                                                    {item[card.labelKey]}
                                                                </p>
                                                                {card.subtitle && item[card.subtitle] && (
                                                                    <p className="truncate text-[10px] text-slate-500" title={item[card.subtitle]}>
                                                                        {item[card.subtitle]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                'flex-shrink-0 text-[10px] font-semibold',
                                                                idx === 0 && 'bg-amber-100 text-amber-800',
                                                            )}
                                                        >
                                                            {item.count}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">No data available</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
