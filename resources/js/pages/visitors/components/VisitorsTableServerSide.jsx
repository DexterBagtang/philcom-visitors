import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import VisitorInsights from './VisitorInsights';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getAvatarColor } from '@/pages/visitors/helpers/visitor-helpers.js';
import { router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format, isAfter, isBefore, isPast, isYesterday, startOfToday } from 'date-fns';
import {
    Activity,
    AlertTriangle,
    ArrowUpDown,
    Building2,
    Calendar as CalendarIcon,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    LogOut,
    RefreshCcw,
    Search,
    Target,
    TrendingUp,
    User,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
const ValidationDialog = lazy(()=> import('./ValidationDialog'));
const CheckoutDialog = lazy(()=> import('@/pages/visitors/components/CheckoutDialog.jsx'));
const BulkCheckoutDialog = lazy(()=> import('@/pages/visitors/components/BulkCheckoutDialog.jsx'));


export default function VisitorsTableServerSide({ visits = {}, meta = {}, onRefresh }) {
    // Server-side state management
    const [sorting, setSorting] = useState([]);
    const [localSearch, setLocalSearch] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [activeQuickFilter, setActiveQuickFilter] = useState(null);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Dialog state
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [availableBadges, setAvailableBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState(null);
    const [selectedVisitIds, setSelectedVisitIds] = useState([]);
    const [showBulkCheckoutDialog, setShowBulkCheckoutDialog] = useState(false);

    // Echo for real-time updates
    useEchoPublic('visits', 'VisitCreated', (event) => {
        const visitorName = event.visit.visitor?.name ?? 'Unknown';
        toast.info(`Visitor ${visitorName} checked in`, { position: 'bottom-right' });
        router.reload()
    });

    // Read URL query params on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const quickFilter = urlParams.get('quickFilter');
        if (quickFilter) {
            setActiveQuickFilter(quickFilter);
        }
    }, []);

    // Safe data handling
    const tableData = visits?.data || [];
    const tableMeta = {
        pageCount: meta.pageCount || 0,
        pageIndex: meta.pageIndex || 0,
        pageSize: meta.pageSize || 20,
        total: meta.total || 0,
        hasNextPage: meta.hasNextPage || false,
        hasPreviousPage: meta.hasPreviousPage || false,
    };

    // Server request function
    // Update the makeServerRequest function to preserve sorting state
    const makeServerRequest = useCallback((params = {}) => {
        const requestParams = {
            pageIndex: tableMeta.pageIndex,
            pageSize: tableMeta.pageSize,
            // Preserve current sorting state unless explicitly overridden
            ...(sorting && !params.hasOwnProperty('sorting') && { sorting }),
            // Preserve other current filters unless explicitly overridden
            ...(activeQuickFilter && !params.hasOwnProperty('quickFilter') && { quickFilter: activeQuickFilter }),
            ...(localSearch && !params.hasOwnProperty('globalFilter') && { globalFilter: localSearch }),
            ...(dateRange.from && !params.hasOwnProperty('dateRange[from]') && { 'dateRange[from]': format(dateRange.from, 'yyyy-MM-dd') }),
            ...(dateRange.to && !params.hasOwnProperty('dateRange[to]') && { 'dateRange[to]': format(dateRange.to, 'yyyy-MM-dd') }),
            ...params,
        };

        router.get(route('visitors.table'), requestParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [tableMeta.pageIndex, tableMeta.pageSize, sorting, activeQuickFilter, localSearch, dateRange.from, dateRange.to]);

    // Debounced search handler
    const handleSearchChange = (value) => {
        setLocalSearch(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            makeServerRequest({
                globalFilter: value || undefined,
                pageIndex: 0, // Reset to first page when searching
            });
        }, 500);

        setSearchTimeout(timeout);
    };

    // Quick filters
    const quickFilters = [
        {
            id: 'today',
            label: 'Today',
            icon: CalendarIcon,
        },
        {
            id: 'week',
            label: 'This Week',
            icon: TrendingUp,
        },
        {
            id: 'checked_in',
            label: 'Checked In',
            icon: User,
        },
        {
            id: 'ongoing',
            label: 'Ongoing',
            icon: Activity,
        },
        {
            id: 'checked_out',
            label: 'Checked Out',
            icon: UserCheck,
        },
        {
            id: 'denied',
            label: 'Denied',
            icon: XCircle,
        },
        {
            id: 'overdue',
            label: 'Overdue',
            icon: AlertTriangle,
        },
    ];

    // Handle quick filter
    const handleQuickFilter = (filterId) => {
        const newQuickFilter = activeQuickFilter === filterId ? null : filterId;
        setActiveQuickFilter(newQuickFilter);
        setSelectedVisitIds([]); // Clear selections when filter changes

        makeServerRequest({
            quickFilter: newQuickFilter || undefined,
            pageIndex: 0,
        });
    };

    // Handle date range filter
    const handleDateRangeFilter = (range) => {
        setDateRange(range);

        makeServerRequest({
            'dateRange[from]': range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
            'dateRange[to]': range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
            pageIndex: 0,
        });
    };

    // Clear all filters
    const clearAllFilters = () => {
        setLocalSearch('');
        setActiveQuickFilter(null);
        setDateRange({ from: null, to: null });

        makeServerRequest({
            globalFilter: undefined,
            quickFilter: undefined,
            'dateRange[from]': undefined,
            'dateRange[to]': undefined,
            pageIndex: 0,
        });
    };

    // Pagination handlers
    const handlePageChange = (newPageIndex) => {
        makeServerRequest({ pageIndex: newPageIndex });
    };

    const handlePageSizeChange = (newPageSize) => {
        makeServerRequest({
            pageSize: newPageSize,
            pageIndex: 0,
        });
    };

    // Sorting handler
    // Update the handleSortingChange function
    const handleSortingChange = (columnId) => {
        const currentSort = sorting && sorting.id === columnId ? sorting : null;
        let newSorting;

        if (!currentSort) {
            newSorting = { id: columnId, desc: false };
        } else if (!currentSort.desc) {
            newSorting = { id: columnId, desc: true };
        } else {
            newSorting = null; // reset
        }

        setSorting(newSorting);

        makeServerRequest({
            sorting: newSorting, // ✅ send single object or null
        });
    };


    // Fetch available badges
    useEffect(() => {
        fetchAvailableBadges();
    }, []);

    const fetchAvailableBadges = async () => {
        setIsLoadingBadges(true);
        try {
            const response = await fetch(route('visits.available-badges'));
            const data = await response.json();
            if (data.success) {
                setAvailableBadges(data.badges);
            }
        } catch (error) {
            console.error('Failed to fetch badges:', error);
            setAvailableBadges([]);
        } finally {
            setIsLoadingBadges(false);
        }
    };

    // Selection handlers for bulk checkout
    const ongoingVisits = tableData.filter(v => v.status === 'ongoing');
    const allOngoingSelected = ongoingVisits.length > 0 && ongoingVisits.every(v => selectedVisitIds.includes(v.id));
    const someOngoingSelected = ongoingVisits.some(v => selectedVisitIds.includes(v.id));

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedVisitIds(ongoingVisits.map(v => v.id));
        } else {
            setSelectedVisitIds([]);
        }
    };

    const handleSelectVisit = (visitId, checked) => {
        if (checked) {
            setSelectedVisitIds(prev => [...prev, visitId]);
        } else {
            setSelectedVisitIds(prev => prev.filter(id => id !== visitId));
        }
    };

    const getSelectedVisits = () => {
        return tableData.filter(v => selectedVisitIds.includes(v.id));
    };

    // Action handlers
    const handleValidateVisitor = (visit) => {
        setSelectedVisit(visit);
        setSelectedVisitor(visit.visitor);
        setShowValidationDialog(true);
    };

    const handleViewReport = async (visitId) => {
        toast('Event has been created.');
    };

    const handleDeleteVisitor = (visitorId) => {
        if (confirm('Are you sure you want to delete this visitor?')) {
            router.delete(route('visitors.destroy', visitorId), {
                onSuccess: () => {
                    onRefresh?.();
                },
            });
        }
    };

    // Status configuration
    const statusConfig = {
        checked_in: {
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
            label: 'Checked In',
        },
        ongoing: {
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
            label: 'Ongoing Visit',
        },
        checked_out: {
            color: 'bg-slate-50 text-slate-700 border-slate-200',
            dot: 'bg-slate-500',
            label: 'Checked Out',
        },
        denied: {
            color: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
            label: 'Denied',
        },
    };

    // Show checkbox column only when filtering ongoing/overdue visits
    const showCheckboxColumn = activeQuickFilter === 'ongoing' || activeQuickFilter === 'overdue';

    // Table columns
    const columns = [
        // Conditionally include checkbox column
        ...(showCheckboxColumn ? [{
            id: 'select',
            header: () => (
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={allOngoingSelected}
                        indeterminate={someOngoingSelected && !allOngoingSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all ongoing visits"
                        disabled={ongoingVisits.length === 0}
                    />
                </div>
            ),
            cell: ({ row }) => {
                const visit = row.original;
                const isOngoing = visit.status === 'ongoing';
                const isSelected = selectedVisitIds.includes(visit.id);

                if (!isOngoing) {
                    return <div className="flex items-center justify-center w-4" />;
                }

                return (
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectVisit(visit.id, checked)}
                            aria-label={`Select ${visit.visitor?.name}`}
                        />
                    </div>
                );
            },
        }] : []),
        {
            accessorFn: (row) => row.visitor?.name,
            id: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => handleSortingChange('name')}
                    className="h-auto p-0 font-semibold text-slate-700 hover:bg-transparent hover:text-slate-900"
                >
                    <User className="mr-2 h-4 w-4" />
                    Visitor Name
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            ),
            cell: ({ row }) => {
                const visitorType = row.original.visitor?.type;
                const avatarColor = getAvatarColor(visitorType);

                return (
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${avatarColor} text-xs font-medium text-white`}>
                                {row
                                    .getValue('visitor.name')
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .substring(0, 2)}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{row.getValue('visitor.name')}</p>
                            <p className="text-xs text-slate-500 capitalize">{visitorType}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorFn: (row) => row.visitor?.company,
            id: 'company',
            header: () => (
                <div className="flex items-center font-semibold text-slate-700">
                    <Building2 className="mr-2 h-4 w-4" />
                    Company
                </div>
            ),
            cell: ({ row }) => (
                <div className="max-w-[180px]">
                    <p className="truncate text-sm font-medium text-slate-900">{row.getValue('visitor.company') || 'N/A'}</p>
                </div>
            ),
        },
        {
            accessorFn: (row) => row.visitor?.person_to_visit,
            id: 'person_to_visit',
            header: () => (
                <div className="flex items-center font-semibold text-slate-700">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Host
                </div>
            ),
            cell: ({ row }) => (
                <div className="max-w-[150px]">
                    <p className="truncate text-sm font-medium text-slate-900">{row.getValue('visitor.person_to_visit')}</p>
                </div>
            ),
        },
        {
            accessorFn: (row) => row.visitor?.visit_purpose,
            id: 'visit_purpose',
            header: () => (
                <div className="flex items-center font-semibold text-slate-700">
                    <Target className="mr-2 h-4 w-4" />
                    Purpose
                </div>
            ),
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm text-slate-700" title={row.getValue('visitor.visit_purpose')}>
                        {row.getValue('visitor.visit_purpose')}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            id: 'status',
            header: () => (
                <div className="flex items-center font-semibold text-slate-700">
                    <Activity className="mr-2 h-4 w-4" />
                    Status
                </div>
            ),
            cell: ({ row }) => {
                const status = row.getValue('status');
                const visit = row.original;
                const config = statusConfig[status];

                return (
                    <div className="space-y-1">
                        <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${config.dot} mr-2`}></div>
                            <Badge className={`${config.color} border px-2 py-0.5 text-xs font-medium`} variant="outline">
                                {config.label}
                            </Badge>
                        </div>
                        {status === 'ongoing' && visit.current_badge_assignment?.badge && (
                            <div className="ml-4 flex items-center">
                                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                    Badge #{visit.current_badge_assignment.badge.badge_number}
                                </Badge>
                            </div>
                        )}
                        {status === 'denied' && visit.denial_reason && (
                            <div className="ml-4 mt-1">
                                <p className="text-xs text-red-600 italic">
                                    {visit.denial_reason}
                                </p>
                            </div>
                        )}
                        {isBefore(visit.check_in_time, startOfToday()) && status !== 'checked_out' && status !== 'denied' && (
                            <div className="ml-4 flex items-center">
                                <Badge variant="outline" className="border-red-200 bg-red-50 px-1 text-xs font-light text-red-700">
                                    Overdue
                                </Badge>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'check_in_time',
            id: 'check_in_time',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => handleSortingChange('check_in_time')}
                    className="h-auto p-0 font-semibold text-slate-700 hover:bg-transparent hover:text-slate-900"
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Check-in Time
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue('check_in_time'));
                return (
                    <div className="text-center text-sm">
                        <p className="text-sm font-medium text-slate-900">
                            {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-500">
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </p>
                    </div>
                );
            },
        },
        {
            id: 'action',
            header: () => <div className="text-center font-semibold text-slate-700">Actions</div>,
            cell: ({ row }) => {
                const status = row.original.status;
                const visit = row.original;

                if (status === 'checked_in') {
                    return (
                        <div className="flex justify-center" onClick={(e)=> e.stopPropagation()}>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleValidateVisitor(visit)}
                                className="bg-blue-600 px-4 font-medium shadow-sm hover:bg-blue-700"
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Validate
                            </Button>
                        </div>
                    );
                }

                if (status === 'ongoing') {
                    return (
                        <div className="flex justify-center" onClick={(e)=> e.stopPropagation()}>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    setCheckoutVisit(visit);
                                    setShowCheckoutDialog(true);
                                }}
                                className="px-4 font-medium shadow-sm"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Check Out
                            </Button>
                        </div>
                    );
                }

                if (status === 'checked_out') {
                    return (
                        <div className="flex justify-center" onClick={(e)=> e.stopPropagation()}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/visits/${row.original.id}?from=dashboard`,{},{preserveState:true})}
                                className="border-slate-200 px-4 font-medium shadow-sm hover:bg-slate-50"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        </div>
                    );
                }

                if (status === 'denied') {
                    return (
                        <div className="flex justify-center" onClick={(e)=> e.stopPropagation()}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/visits/${row.original.id}?from=dashboard`,{},{preserveState:true})}
                                className="border-red-200 px-4 font-medium shadow-sm hover:bg-red-50 text-red-600"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        </div>
                    );
                }

                return <div className="flex justify-center">-</div>;
            },
        },
        /*{
            id: 'more',
            header: '',
            cell: ({ row }) => {
                const visitor = row.original;
                return (
                    <div className="flex justify-center" onClick={(e)=>e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => alert(`View ${visitor.visitor?.name}`)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert(`Edit ${visitor.visitor?.name}`)} className="cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Visitor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDeleteVisitor(visitor.visitor?.id)}
                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },*/
    ];

    // Initialize table (client-side rendering only)
    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: tableMeta.pageCount,
    });

    // Check for active filters
    const hasActiveFilters = activeQuickFilter || dateRange.from || dateRange.to || localSearch;

    return (
        <>
            <div className="space-y-6">
                {/* Visitor Insights Section */}
                <VisitorInsights />
                {/* Enhanced Top Controls with Modern Design */}
                <div className="rounded-xl border border-slate-200/60 bg-white shadow-sm backdrop-blur-sm">
                    {/* Main content area with better spacing */}
                    <div className="p-6 pb-4">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            {/* Left section - Search and actions */}
                            <div className="flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center">
                                {/* Enhanced search input with better visual weight */}
                                <div className="relative max-w-md flex-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </div>

                                    <Input
                                        placeholder="Search by name, company, or purpose..."
                                        value={localSearch}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full rounded-lg border-slate-300 bg-slate-50/50 py-3 pr-4 pl-10 text-slate-900 placeholder-slate-500 transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500/20"
                                    />

                                    {/* Clear button */}
                                    {localSearch && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSearchChange('')}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Action buttons with better spacing */}
                                <div className="flex items-center gap-2">
                                    <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'flex items-center gap-2 border-slate-300 text-sm',
                                                    (dateRange.from || dateRange.to) && 'border-blue-500 bg-blue-50 text-blue-700',
                                                )}
                                            >
                                                <CalendarIcon className="h-4 w-4" />
                                                Date Filter
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto" align="start">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-sm font-medium">Select Date Range</Label>
                                                    <Calendar
                                                        mode="range"
                                                        selected={dateRange}
                                                        onSelect={(range) =>
                                                            handleDateRangeFilter(
                                                                range || {
                                                                    from: null,
                                                                    to: null,
                                                                },
                                                            )
                                                        }
                                                        numberOfMonths={2}
                                                        className="rounded-md border"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDateRangeFilter({ from: null, to: null })}
                                                    >
                                                        Clear
                                                    </Button>
                                                    <Button size="sm" onClick={() => setShowDateFilter(false)}>
                                                        Apply
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {selectedVisitIds.length > 0 && (
                                        <Button
                                            onClick={() => setShowBulkCheckoutDialog(true)}
                                            variant="destructive"
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <CheckSquare className="h-4 w-4" />
                                            Bulk Checkout ({selectedVisitIds.length})
                                        </Button>
                                    )}

                                    <Button
                                        onClick={onRefresh}
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2"
                                        title="Refresh visitor list"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        Refresh
                                    </Button>

                                    {hasActiveFilters && (
                                        <Button
                                            onClick={clearAllFilters}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4" />
                                            Clear All Filters
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Right section - Stats and pagination */}
                            <div className="flex min-w-0 items-center justify-between gap-6 sm:justify-end">
                                {/* Enhanced visitor count with icon */}
                                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">{tableMeta.total}</span>
                                    <span className="text-sm text-blue-700">visitor{tableMeta.total !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Pagination controls with better visual hierarchy */}
                                <div className="flex items-center gap-4">
                                    <div className="text-sm font-medium whitespace-nowrap text-slate-600">
                                        Page <span className="font-semibold text-slate-900">{tableMeta.pageIndex + 1}</span> of{' '}
                                        <span className="font-semibold text-slate-900">{tableMeta.pageCount}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label htmlFor="pageSize" className="text-sm font-medium whitespace-nowrap text-slate-600">
                                            Show:
                                        </label>
                                        <Select value={`${tableMeta.pageSize}`} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                                            <SelectTrigger className="h-9 w-20 border-slate-300">
                                                <SelectValue placeholder={tableMeta.pageSize} />
                                            </SelectTrigger>
                                            <SelectContent side="top">
                                                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                                        {pageSize}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Quick filters bar */}
                    <div className="border-t border-slate-100 px-6 pt-4 pb-4">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-600">Quick filters:</span>
                                {quickFilters.map((filter) => {
                                    const isActive = activeQuickFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => handleQuickFilter(filter.id)}
                                            className={cn(
                                                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700',
                                            )}
                                        >
                                            <filter.icon className="h-3 w-3" />
                                            {filter.label}
                                            {isActive && <X className="ml-1 h-3 w-3" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active filters display */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                                    <span className="text-xs font-medium text-slate-500">Active filters:</span>

                                    {localSearch && (
                                        <Badge variant="secondary" className="text-xs">
                                            Search: "{localSearch}"
                                            <button onClick={() => handleSearchChange('')} className="ml-1 hover:text-red-600">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}

                                    {activeQuickFilter && (
                                        <Badge variant="secondary" className="text-xs">
                                            {quickFilters.find((f) => f.id === activeQuickFilter)?.label}
                                            <button onClick={() => handleQuickFilter(activeQuickFilter)} className="ml-1 hover:text-red-600">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}

                                    {(dateRange.from || dateRange.to) && (
                                        <Badge variant="secondary" className="text-xs">
                                            Date Range: {dateRange.from ? format(dateRange.from, 'MMM dd') : '...'} -{' '}
                                            {dateRange.to ? format(dateRange.to, 'MMM dd') : '...'}
                                            <button
                                                onClick={() => handleDateRangeFilter({ from: null, to: null })}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Table with Modern Styling */}
                <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className="border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-slate-100/50"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="px-6 py-4 text-left font-semibold">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {tableData.length ? (
                                tableData.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        onClick={()=>{router.get(`/visits/${row.id}`,{from:'visitors'})}}
                                        className={`border-b border-slate-100/50 transition-all duration-200 hover:bg-gradient-to-r cursor-pointer hover:from-slate-50/50 hover:to-blue-50/30 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                                        }`}
                                    >
                                        {table.getAllLeafColumns().map((column) => (
                                            <TableCell key={column.id} className="px-3 py-2">
                                                {flexRender(column.columnDef.cell, {
                                                    row: {
                                                        original: row,
                                                        getValue: (key) => {
                                                            // Handle nested properties
                                                            const keys = key.split('.');
                                                            return keys.reduce((obj, k) => (obj ? obj[k] : null), row);
                                                        },
                                                    },
                                                })}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                                                <User className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-slate-900">No visitors found</p>
                                                <p className="max-w-md text-sm text-slate-500">
                                                    {hasActiveFilters
                                                        ? 'No visitors match your current filters. Try adjusting or clearing your filters.'
                                                        : 'No visitors have been registered yet'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-3">
                                                        Clear all filters
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Enhanced Bottom Controls */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm backdrop-blur-sm">
                    <div className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">{tableMeta.pageIndex * tableMeta.pageSize + 1}</span> to{' '}
                        <span className="font-semibold text-slate-900">
                            {Math.min((tableMeta.pageIndex + 1) * tableMeta.pageSize, tableMeta.total)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-900">{tableMeta.total}</span> visitors
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(tableMeta.pageIndex - 1)}
                            disabled={!tableMeta.hasPreviousPage}
                            className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(tableMeta.pageIndex + 1)}
                            disabled={!tableMeta.hasNextPage}
                            className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Validation Dialog */}
            <Suspense fallback={null}>
                <ValidationDialog
                    isOpen={showValidationDialog}
                    onClose={() => {
                        setShowValidationDialog(false);
                        setSelectedVisit(null);
                        setSelectedVisitor(null);
                    }}
                    visitor={selectedVisitor}
                    visit={selectedVisit}
                    availableBadges={availableBadges}
                    onSuccess={() => {
                        onRefresh?.();
                    }}
                />
            </Suspense>

            <Suspense fallback={null}>
                <CheckoutDialog
                    isOpen={showCheckoutDialog}
                    onClose={() => {
                        setShowCheckoutDialog(false);
                        setCheckoutVisit(null);
                    }}
                    visit={checkoutVisit}
                    onSuccess={() => {
                        onRefresh?.();
                    }}
                />
            </Suspense>

            <Suspense fallback={null}>
                <BulkCheckoutDialog
                    isOpen={showBulkCheckoutDialog}
                    onClose={() => {
                        setShowBulkCheckoutDialog(false);
                    }}
                    selectedVisits={getSelectedVisits()}
                    onSuccess={() => {
                        setSelectedVisitIds([]);
                        onRefresh?.();
                    }}
                />
            </Suspense>
        </>
    );
}
