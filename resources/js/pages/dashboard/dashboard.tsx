import { lazy, Suspense, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight } from 'lucide-react';
const QuickStats = lazy(() => import('@/pages/dashboard/components/QuickStats'));
const TodaysVisitorsTable = lazy(() => import('@/pages/dashboard/components/TodaysVisitorsTable'));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard'
    }
];

interface Visit {
    id: number;
    status: string;
    check_in_time: string;
    visitor?: {
        name: string;
        company?: string;
    };
}

interface DashboardProps {
    visits: Visit[];
    overdueCount: number;
}

export default function Dashboard({ visits, overdueCount }: DashboardProps) {
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const handleFilterChange = (filterId: string | null) => {
        setActiveFilter(filterId === activeFilter ? null : filterId); // Toggle behavior
    };

    const handleClearFilters = () => {
        setActiveFilter(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {overdueCount > 0 && (
                    <Link href="/visitors/index?quickFilter=overdue">
                        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 dark:text-amber-200">
                                Overdue Visitors Require Attention
                            </AlertTitle>
                            <AlertDescription className="text-amber-700 dark:text-amber-300 flex items-center justify-between">
                                <span>
                                    {overdueCount} visitor{overdueCount > 1 ? 's' : ''} checked in more than 12 hours ago and still showing as ongoing.
                                    Click to review and checkout.
                                </span>
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </AlertDescription>
                        </Alert>
                    </Link>
                )}

                <Suspense fallback={null}>
                    <QuickStats
                        visitors={visits}
                        activeFilter={activeFilter}
                        onFilterChange={handleFilterChange}
                    />
                </Suspense>

                <Suspense fallback={null}>

                    <TodaysVisitorsTable
                        visitors={visits}
                        activeQuickFilter={activeFilter}
                        onQuickFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onRefresh={() => {
                        }}
                    />
                </Suspense>
            </div>
        </AppLayout>
    );
}
