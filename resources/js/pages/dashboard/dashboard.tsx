import AppLayout from '@/layouts/app-layout';
import QuickStats from '@/pages/dashboard/components/QuickStats';
import TodaysVisitorsTable from '@/pages/dashboard/components/TodaysVisitorsTable';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
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
                <QuickStats
                    visitors={visits}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                />

                <TodaysVisitorsTable
                    visitors={visits}
                    activeQuickFilter={activeFilter}
                    onQuickFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            </div>
        </AppLayout>
    );
}
