import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    CalendarIcon,
    Download,
    FileSpreadsheet,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar as CalendarDays,
    TrendingUp,
    BarChart3,
    Filter,
    Settings2,
    Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BreadcrumbItem } from '@/types';
import { PreviewDialog } from './components/preview-dialog';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { FilterSummary } from './components/filter-summary';

interface ExportStats {
    total_visits: number;
    today_visits: number;
    this_week_visits: number;
    this_month_visits: number;
}

interface Props {
    stats: ExportStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Export Visitors',
        href: '/exports',
    },
];

const VISITOR_TYPE_OPTIONS: MultiSelectOption[] = [
    { label: 'Contractor', value: 'Contractor' },
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Visitor', value: 'Visitor' },
    { label: 'Client', value: 'Client' },
    { label: 'Delivery Personnel', value: 'Delivery Personnel' },
    { label: 'Applicant', value: 'Applicant' },
    { label: 'Other', value: 'Other' },
];

const VISIT_PURPOSE_OPTIONS: MultiSelectOption[] = [
    { label: 'Official Business', value: 'Official Business' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Delivery', value: 'Delivery' },
    { label: 'Collection', value: 'Collection' },
    { label: 'Payment', value: 'Payment' },
    { label: 'Billing', value: 'Billing' },
    { label: 'Submit Documents / Requirements', value: 'Submit Documents / Requirements' },
    { label: 'Interview', value: 'Interview' },
    { label: 'Repair/Maintenance', value: 'Repair/Maintenance' },
    { label: 'Others', value: 'Others' },
];

export default function ExportPage({ stats }: Props) {
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [status, setStatus] = useState<string>('all');
    const [includeCheckout, setIncludeCheckout] = useState(true);
    const [visitorTypes, setVisitorTypes] = useState<string[]>([]);
    const [visitPurposes, setVisitPurposes] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    const handleQuickDateRange = (range: string) => {
        const today = new Date();

        switch (range) {
            case 'today':
                setDateFrom(today);
                setDateTo(today);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setDateFrom(yesterday);
                setDateTo(yesterday);
                break;
            case 'this_week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                setDateFrom(weekStart);
                setDateTo(today);
                break;
            case 'last_week':
                const lastWeekEnd = new Date(today);
                lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                setDateFrom(lastWeekStart);
                setDateTo(lastWeekEnd);
                break;
            case 'last_7_days':
                const last7Start = new Date(today);
                last7Start.setDate(today.getDate() - 6);
                setDateFrom(last7Start);
                setDateTo(today);
                break;
            case 'last_30_days':
                const last30Start = new Date(today);
                last30Start.setDate(today.getDate() - 29);
                setDateFrom(last30Start);
                setDateTo(today);
                break;
            case 'last_90_days':
                const last90Start = new Date(today);
                last90Start.setDate(today.getDate() - 89);
                setDateFrom(last90Start);
                setDateTo(today);
                break;
            case 'this_month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateFrom(monthStart);
                setDateTo(today);
                break;
            case 'last_month':
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                setDateFrom(lastMonthStart);
                setDateTo(lastMonthEnd);
                break;
            case 'this_quarter':
                const currentQuarter = Math.floor(today.getMonth() / 3);
                const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
                setDateFrom(quarterStart);
                setDateTo(today);
                break;
            case 'year_to_date':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                setDateFrom(yearStart);
                setDateTo(today);
                break;
            case 'last_year':
                const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                setDateFrom(lastYearStart);
                setDateTo(lastYearEnd);
                break;
            case 'all':
                setDateFrom(undefined);
                setDateTo(undefined);
                break;
        }
    };

    const handleExport = () => {
        setIsExporting(true);

        const params = new URLSearchParams();

        if (dateFrom) {
            params.append('date_from', format(dateFrom, 'yyyy-MM-dd'));
        }
        if (dateTo) {
            params.append('date_to', format(dateTo, 'yyyy-MM-dd'));
        }
        if (status !== 'all') {
            params.append('status', status);
        }
        params.append('include_checkout', includeCheckout ? '1' : '0');

        visitorTypes.forEach((type) => {
            params.append('visitor_types[]', type);
        });

        visitPurposes.forEach((purpose) => {
            params.append('visit_purposes[]', purpose);
        });

        const link = document.createElement('a');
        link.href = `/exports/download?${params.toString()}`;
        link.click();

        setTimeout(() => {
            setIsExporting(false);
            toast.success('Export started! Your download will begin shortly.', {
                position: 'top-center',
                duration: 3000,
            });
        }, 500);
    };

    const handleClearAllFilters = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
        setStatus('all');
        setVisitorTypes([]);
        setVisitPurposes([]);
        setIncludeCheckout(true);
    };

    const handleRemoveVisitorType = (type: string) => {
        setVisitorTypes(visitorTypes.filter((t) => t !== type));
    };

    const handleRemoveVisitPurpose = (purpose: string) => {
        setVisitPurposes(visitPurposes.filter((p) => p !== purpose));
    };

    const getRecordCountEstimate = () => {
        if (dateFrom && dateTo) {
            const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return stats.today_visits;
            if (diffDays <= 7) return Math.round((stats.this_week_visits / 7) * diffDays);
            if (diffDays <= 30) return Math.round((stats.this_month_visits / 30) * diffDays);
            return '~' + Math.round((stats.this_month_visits / 30) * diffDays);
        }
        return stats.total_visits;
    };

    const hasActiveFilters = dateFrom || dateTo || status !== 'all' || visitorTypes.length > 0 || visitPurposes.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Export Visitors" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Visits</CardTitle>
                            <div className="rounded-full bg-blue-100 p-2">
                                <Users className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.total_visits.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">All time records</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Today</CardTitle>
                            <div className="rounded-full bg-emerald-100 p-2">
                                <Clock className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.today_visits.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">Visits today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">This Week</CardTitle>
                            <div className="rounded-full bg-amber-100 p-2">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.this_week_visits.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">Past 7 days</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
                            <div className="rounded-full bg-purple-100 p-2">
                                <BarChart3 className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.this_month_visits.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">Current month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Export Card */}
                <Card className="border-t-4 border-t-blue-600 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-600 p-2">
                                    <FileSpreadsheet className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Export Visitors to Excel</CardTitle>
                                    <CardDescription className="mt-1">
                                        Configure your export settings and download visitor records
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                        {/* Date Range Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Date Range</h3>
                            </div>

                            {/* Quick Select Buttons - Organized by Category */}
                            <div className="space-y-4 rounded-lg bg-slate-50/50 p-4 border">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Quick Select</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300" onClick={() => handleQuickDateRange('today')}>
                                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                                            Today
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300" onClick={() => handleQuickDateRange('yesterday')}>
                                            Yesterday
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300" onClick={() => handleQuickDateRange('this_week')}>
                                            This Week
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300" onClick={() => handleQuickDateRange('this_month')}>
                                            This Month
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Recent Periods</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-emerald-50 hover:border-emerald-300" onClick={() => handleQuickDateRange('last_7_days')}>
                                            Last 7 Days
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-emerald-50 hover:border-emerald-300" onClick={() => handleQuickDateRange('last_30_days')}>
                                            Last 30 Days
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-emerald-50 hover:border-emerald-300" onClick={() => handleQuickDateRange('last_90_days')}>
                                            Last 90 Days
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Specific Periods</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300" onClick={() => handleQuickDateRange('last_week')}>
                                            Last Week
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300" onClick={() => handleQuickDateRange('last_month')}>
                                            Last Month
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300" onClick={() => handleQuickDateRange('this_quarter')}>
                                            This Quarter
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300" onClick={() => handleQuickDateRange('year_to_date')}>
                                            Year to Date
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300" onClick={() => handleQuickDateRange('last_year')}>
                                            Last Year
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="hover:bg-slate-50 hover:border-slate-300" onClick={() => handleQuickDateRange('all')}>
                                            All Records
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Date Pickers */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date-from" className="text-sm font-medium text-slate-700">From Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date-from"
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !dateFrom && 'text-muted-foreground',
                                                    dateFrom && 'border-blue-300 bg-blue-50/50'
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateFrom ? format(dateFrom, 'PPP') : 'Select start date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus disabled={(date) => date > new Date()} />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date-to" className="text-sm font-medium text-slate-700">To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date-to"
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !dateTo && 'text-muted-foreground',
                                                    dateTo && 'border-blue-300 bg-blue-50/50'
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateTo ? format(dateTo, 'PPP') : 'Select end date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus disabled={(date) => date > new Date() || (dateFrom && date < dateFrom)} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Filters Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                            </div>

                            <FilterSummary
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                status={status}
                                visitorTypes={visitorTypes}
                                visitPurposes={visitPurposes}
                                onRemoveDateRange={() => {
                                    setDateFrom(undefined);
                                    setDateTo(undefined);
                                }}
                                onRemoveStatus={() => setStatus('all')}
                                onRemoveVisitorType={handleRemoveVisitorType}
                                onRemoveVisitPurpose={handleRemoveVisitPurpose}
                                onClearAll={handleClearAllFilters}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-medium text-slate-700">Visit Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger id="status" className={cn(status !== 'all' && 'border-blue-300 bg-blue-50/50')}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="checked_in">Checked In</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="checked_out">Checked Out</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visitor-types" className="text-sm font-medium text-slate-700">Visitor Types</Label>
                                    <MultiSelect
                                        options={VISITOR_TYPE_OPTIONS}
                                        selected={visitorTypes}
                                        onChange={setVisitorTypes}
                                        placeholder="All types"
                                        className={cn(visitorTypes.length > 0 && 'border-blue-300 bg-blue-50/50')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visit-purposes" className="text-sm font-medium text-slate-700">Visit Purposes</Label>
                                    <MultiSelect
                                        options={VISIT_PURPOSE_OPTIONS}
                                        selected={visitPurposes}
                                        onChange={setVisitPurposes}
                                        placeholder="All purposes"
                                        className={cn(visitPurposes.length > 0 && 'border-blue-300 bg-blue-50/50')}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Export Options Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Export Options</h3>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="include-checkout"
                                        checked={includeCheckout}
                                        onCheckedChange={(checked) => setIncludeCheckout(checked as boolean)}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1">
                                        <label
                                            htmlFor="include-checkout"
                                            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Include check-out time and duration columns
                                        </label>
                                        <p className="text-xs text-slate-600">
                                            When enabled, the export will include check-out date, time, and visit duration in the Excel file
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Export Information */}
                        <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-600 p-2">
                                    <Info className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-semibold text-slate-900">Export Information</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-700">Estimated records:</span>
                                        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                                            {getRecordCountEstimate()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        The Excel file will include: Visit ID, Visitor Name, Company, Type, Person to Visit,
                                        Purpose, Status, Badge Number, Check-in/out Times, Duration, and Validation Details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClearAllFilters}
                                    className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                >
                                    Clear Filters
                                </Button>
                            )}
                            <PreviewDialog
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                status={status}
                                visitorTypes={visitorTypes}
                                visitPurposes={visitPurposes}
                                includeCheckout={includeCheckout}
                                onExport={handleExport}
                            />
                            <Button
                                onClick={handleExport}
                                disabled={isExporting}
                                size="lg"
                                className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export to Excel
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
