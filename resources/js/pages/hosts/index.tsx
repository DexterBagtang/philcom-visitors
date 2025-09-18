import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import HostsTable from '@/pages/hosts/components/hosts-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Hosts',
        href: '/hosts',
    },
];

export default function Hosts({ hosts }: { hosts: undefined }) {
    // console.log(hosts);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hosts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 md:min-h-min dark:border-sidebar-border">
                    <HostsTable hosts={hosts} onRefresh={undefined} />
                </div>
            </div>
        </AppLayout>
    );
}
