import { lazy, Suspense, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
const QuickStats = lazy(() => import('@/pages/dashboard/components/QuickStats'));
const TodaysVisitorsTable = lazy(() => import('@/pages/dashboard/components/TodaysVisitorsTable'));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard'
    }
];

export default function Dashboard({ visits }) {
    const [activeFilter, setActiveFilter] = useState(null);

    const handleFilterChange = (filterId) => {
        setActiveFilter(filterId === activeFilter ? null : filterId); // Toggle behavior
    };

    const handleClearFilters = () => {
        setActiveFilter(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
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
