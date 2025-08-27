import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import VisitorCheckIn from '@/pages/visitors/components/VisitorCheckIn';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Visitor',
        href: '/visitor-check-in',
    },
];

export default function VisitorCheckin() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <VisitorCheckIn />
                </div>
            </div>
        </AppLayout>
    );
}
