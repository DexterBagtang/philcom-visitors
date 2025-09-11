import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import BadgesTable from '@/pages/badges/BadgesTable';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Badges',
        href: '/badges/index',
    },
];

interface BadgesProps {
    badges: unknown[]
}

export default function Index({badges}: BadgesProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Badges" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div
                    className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 md:min-h-min dark:border-sidebar-border">

                    <BadgesTable badges={badges} />
                </div>
            </div>
        </AppLayout>
    );
}
