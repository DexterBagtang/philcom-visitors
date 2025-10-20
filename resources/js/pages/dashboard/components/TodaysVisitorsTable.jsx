import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.js';
import { cn } from '@/lib/utils.js';
import { getAvatarColor } from '@/pages/visitors/helpers/visitor-helpers.js';
import { router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import {
    Activity,
    ArrowUpDown,
    Building2,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    LogOut,
    RefreshCcw,
    Search,
    Target,
    User,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notification-sound';

const ValidationDialog = lazy(()=> import('../../visitors/components/ValidationDialog.jsx'));
const  CheckoutDialog = lazy(()=> import('@/pages/visitors/components/CheckoutDialog.jsx'));


// Constants
const STATUS_CONFIG = {
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
};

const QUICK_FILTERS = [
    {
        id: 'checked_in',
        label: 'Checked In',
        icon: User,
        filter: () => (row) => row.getValue('status') === 'checked_in',
    },
    {
        id: 'ongoing',
        label: 'Ongoing',
        icon: Activity,
        filter: () => (row) => row.getValue('status') === 'ongoing',
    },
    {
        id: 'checked_out',
        label: 'Checked Out',
        icon: UserCheck,
        filter: () => (row) => row.getValue('status') === 'checked_out',
    },
];

const PAGE_SIZES = [5, 10, 20, 50];

export default function TodaysVisitorsTable({ visitors, activeQuickFilter, onQuickFilterChange, onClearFilters, onRefresh }) {
    // Table state
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // Dialog state
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [checkoutVisit, setCheckoutVisit] = useState(null);

    // Badge state
    const [availableBadges, setAvailableBadges] = useState([]);
    const [isLoadingBadges, setIsLoadingBadges] = useState(false);

    const [columnVisibility, setColumnVisibility] = useState({
        quickFilter: false,
    });

    // Echo listener for real-time updates
    useEchoPublic('visits', 'VisitCreated', (event) => {
        const visitorName = event.visit.visitor?.name ?? 'Unknown';
        
        // Play notification sound
        playNotificationSound();
        
        // Show toast notification
        toast.info(`Visitor ${visitorName} checked in`, { 
            position: 'top-center', 
            duration: 5000 
        });
        
        // Reload data
        router.reload();
    });

    // Memoized handlers
    const handleQuickFilter = useCallback(
        (filterId) => {
            if (activeQuickFilter === filterId) {
                onQuickFilterChange(null);
                setColumnFilters((prev) => prev.filter((f) => f.id !== 'quickFilter'));
            } else {
                onQuickFilterChange(filterId);
                const filter = QUICK_FILTERS.find((f) => f.id === filterId);
                if (filter) {
                    setColumnFilters((prev) => [
                        ...prev.filter((f) => f.id !== 'quickFilter'),
                        {
                            id: 'quickFilter',
                            value: filter.filter(),
                        },
                    ]);
                }
            }
            // ✅ Reset page index when filter changes
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        },
        [activeQuickFilter, onQuickFilterChange],
    );

    const clearAllFilters = useCallback(() => {
        onQuickFilterChange(null);
        setColumnFilters([]);
        setGlobalFilter('');
        onClearFilters?.();
    }, [onQuickFilterChange, onClearFilters]);

    const handleTableRefresh = useCallback(() => {
        router.get(
            '/dashboard',
            {},
            {
                preserveState: false,
                preserveScroll: false,
            },
        );
    }, []);

    const handleViewAllVisitors = useCallback(() => {
        router.visit('/visitors/index');
    }, []);

    const handleValidateVisitor = useCallback((visit) => {
        setSelectedVisit(visit);
        setSelectedVisitor(visit.visitor);
        setShowValidationDialog(true);
    }, []);

    const handleViewReport = useCallback(async (visitId) => {
        console.log('report');
        toast('Event has been created.');
    }, []);

    const handleDeleteVisitor = useCallback(
        (visitorId) => {
            if (confirm('Are you sure you want to delete this visitor?')) {
                router.delete(route('visitors.destroy', visitorId), {
                    onSuccess: () => {
                        onRefresh?.();
                    },
                });
            }
        },
        [onRefresh],
    );

    const handleCheckout = useCallback((visit) => {
        setCheckoutVisit(visit);
        setShowCheckoutDialog(true);
    }, []);

    // Badge fetching
    const fetchAvailableBadges = useCallback(async () => {
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
    }, []);

    // Effects
    useEffect(() => {
        fetchAvailableBadges();
    }, [fetchAvailableBadges, showValidationDialog]);

    useEffect(() => {
        if (activeQuickFilter) {
            const filter = QUICK_FILTERS.find((f) => f.id === activeQuickFilter);
            if (filter) {
                setColumnFilters([{ id: 'quickFilter', value: filter.filter() }]);
            }
        } else {
            setColumnFilters([]);
        }
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [activeQuickFilter]);

    // Memoized table columns
    const columns = useMemo(
        () => [
            {
                accessorFn: (row) => row.visitor?.name,
                id: 'name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
                    const name = row.getValue('name');
                    const initials = name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2);

                    return (
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full ${avatarColor} text-xs font-medium text-white`}
                                >
                                    {initials}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                                <p className="text-xs text-slate-500 capitalize">{visitorType}</p>
                            </div>
                        </div>
                    );
                },
                filterFn: (row, id, value) => {
                    if (typeof value === 'function') {
                        return value(row);
                    }
                    return true;
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
                        <p className="truncate text-sm font-medium text-slate-900">{row.getValue('company') || 'N/A'}</p>
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
                        <p className="truncate text-sm font-medium text-slate-900">{row.getValue('person_to_visit')}</p>
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
                        <p className="truncate text-sm text-slate-700" title={row.getValue('visit_purpose')}>
                            {row.getValue('visit_purpose')}
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
                    const config = STATUS_CONFIG[status];

                    return (
                        <div className="space-y-1">
                            <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full ${config.dot} mr-2`} />
                                <Badge className={`${config.color} border px-2 py-0.5 text-xs font-medium`} variant="outline">
                                    {config.label}
                                </Badge>
                            </div>
                            {status === 'ongoing' && visit.current_badge_assignment?.badge && (
                                <div className="ml-4 flex items-center">
                                    <Badge
                                        variant="outline"
                                        className="border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                    >
                                        Badge #{visit.current_badge_assignment.badge.badge_number}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    );
                },
                filterFn: (row, id, value) => {
                    if (typeof value === 'function') {
                        return value(row);
                    }
                    return true;
                },
            },
            {
                accessorKey: 'check_in_time',
                id: 'check_in_time',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
                        <div className="mltext-sm">
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

                    const actionMap = {
                        checked_in: (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleValidateVisitor(visit)}
                                className="bg-blue-600 px-4 font-medium shadow-sm hover:bg-blue-700"
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Validate
                            </Button>
                        ),
                        ongoing: (
                            <Button variant="destructive" size="sm" onClick={() => handleCheckout(visit)} className="px-4 font-medium shadow-sm">
                                <LogOut className="mr-2 h-4 w-4" />
                                Check Out
                            </Button>
                        ),
                        checked_out: (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/visits/${row.original.id}?from=dashboard`, {}, { preserveState: true })}
                                className="border-slate-200 px-4 font-medium shadow-sm hover:bg-slate-50"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        ),
                    };

                    return (
                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                            {actionMap[status] || <span>-</span>}
                        </div>
                    );
                },
            },
            // {
            //     id: 'more',
            //     header: '',
            //     cell: ({ row }) => {
            //         const visitor = row.original;
            //         return (
            //             <div className="flex justify-center" onClick={(e)=> e.stopPropagation()}>
            //                 <DropdownMenu>
            //                     <DropdownMenuTrigger asChild>
            //                         <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
            //                             <span className="sr-only">Open menu</span>
            //                             <MoreVertical className="h-4 w-4" />
            //                         </Button>
            //                     </DropdownMenuTrigger>
            //                     <DropdownMenuContent align="end" className="w-48">
            //                         <DropdownMenuItem onClick={() => alert(`View ${visitor.visitor?.name}`)} className="cursor-pointer">
            //                             <Eye className="mr-2 h-4 w-4" />
            //                             View Details
            //                         </DropdownMenuItem>
            //                         <DropdownMenuItem onClick={() => alert(`Edit ${visitor.visitor?.name}`)} className="cursor-pointer">
            //                             <Edit className="mr-2 h-4 w-4" />
            //                             Edit Visitor
            //                         </DropdownMenuItem>
            //                         <DropdownMenuItem
            //                             onClick={() => handleDeleteVisitor(visitor.visitor?.id)}
            //                             className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
            //                         >
            //                             <Trash2 className="mr-2 h-4 w-4" />
            //                             Delete
            //                         </DropdownMenuItem>
            //                     </DropdownMenuContent>
            //                 </DropdownMenu>
            //             </div>
            //         );
            //     },
            // },
            // Virtual column for filtering
            {
                id: 'quickFilter',
                filterFn: (row, id, value) => {
                    if (typeof value === 'function') {
                        return value(row);
                    }
                    return true;
                },
            },
        ],
        [handleValidateVisitor, handleCheckout, handleViewReport, handleDeleteVisitor],
    );

    // Table instance
    const table = useReactTable({
        data: visitors,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
            pagination,
        },
        autoResetPageIndex: false,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: 'includesString',
    });

    // Computed values
    const hasActiveFilters = activeQuickFilter || globalFilter;
    const filteredRowsCount = table.getFilteredRowModel().rows.length;
    const totalRowsCount = table.getRowModel().rows.length;
    const currentPageStart = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
    const currentPageEnd = Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredRowsCount);

    // Dialog close handlers
    const closeValidationDialog = useCallback(() => {
        setShowValidationDialog(false);
        setSelectedVisit(null);
        setSelectedVisitor(null);
    }, []);

    const closeCheckoutDialog = useCallback(() => {
        setShowCheckoutDialog(false);
        setCheckoutVisit(null);
    }, []);

    return (
        <>
            <div className="space-y-3">
                {/* Enhanced Top Controls */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    {/* Main header with search and actions */}
                    <div className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Primary section - Search and main actions */}
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                                {/* Search input */}
                                <div className="relative max-w-md flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Search visitors..."
                                        value={globalFilter ?? ''}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        className="w-full border-gray-300 bg-gray-50/50 py-2.5 pr-10 pl-10 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    {globalFilter && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setGlobalFilter('')}
                                            className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleTableRefresh}
                                        variant="ghost"
                                        size="sm"
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </Button>

                                    {hasActiveFilters && (
                                        <Button
                                            onClick={clearAllFilters}
                                            size="sm"
                                            className="flex items-center gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                        >
                                            <X className="h-4 w-4" />
                                            Clear All
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Secondary section - Stats and view all */}
                            <div className="flex items-center gap-4">
                                {/* Visitor count badge */}
                                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-blue-900">{filteredRowsCount}</span>
                                    <span className="text-sm text-blue-700">{filteredRowsCount !== visitors.length ? 'filtered' : ''} visitors</span>
                                </div>

                                {/* View all button */}
                                <Button
                                    onClick={handleViewAllVisitors}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <span className="text-sm font-medium">View All</span>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Filters and pagination row */}
                    <div className="border-t border-gray-100 px-6 py-2">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Quick filters */}
                            <div className="flex flex-wrap gap-2">
                                <span className="mr-2 flex items-center text-sm font-medium text-gray-500">Filters:</span>
                                {QUICK_FILTERS.map((filter) => {
                                    const isActive = activeQuickFilter === filter.id;
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => handleQuickFilter(filter.id)}
                                            className={cn(
                                                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                                                isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                            )}
                                        >
                                            <filter.icon className="h-4 w-4" />
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination controls */}
                            <div className="flex items-center gap-4 text-sm">
                                <span className="whitespace-nowrap text-gray-600">
                                    Page <span className="font-semibold">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                                    <span className="font-semibold">{table.getPageCount()}</span>
                                </span>

                                <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                                    <SelectTrigger className="h-8 w-24 border-gray-300 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZES.map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Active filters indicator */}
                        {hasActiveFilters && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                                <span className="text-xs font-medium text-gray-500">Active:</span>

                                {globalFilter && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs">
                                        Search: "{globalFilter}"
                                        <button onClick={() => setGlobalFilter('')} className="hover:text-red-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}

                                {activeQuickFilter && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                        {QUICK_FILTERS.find((f) => f.id === activeQuickFilter)?.label}
                                        <button onClick={() => handleQuickFilter(activeQuickFilter)} className="hover:text-red-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Table */}
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
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        onClick={() => {
                                            router.get(`/visits/${row.original.id}?from=dashboard`, {}, { preserveState: true });
                                        }}
                                        className={`cursor-pointer border-b border-slate-100/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-blue-50/30 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                                        }`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-3 py-2">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                                                <CalendarIcon className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-slate-900">No visitors today</p>
                                                <p className="max-w-md text-sm text-slate-500">
                                                    {hasActiveFilters
                                                        ? 'No visitors match your current filters for today.'
                                                        : 'No visitors have checked in today yet.'}
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
                {visitors.length > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm backdrop-blur-sm">
                        <div className="text-sm text-slate-600">
                            Showing{' '}
                            <span className="font-semibold text-slate-900">
                                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                            </span>{' '}
                            to{' '}
                            <span className="font-semibold text-slate-900">
                                {Math.min(
                                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                    table.getFilteredRowModel().rows.length,
                                )}
                            </span>{' '}
                            of <span className="font-semibold text-slate-900">{table.getFilteredRowModel().rows.length}</span> visitors
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
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
        </>
    );
}
