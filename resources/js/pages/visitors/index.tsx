import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import VisitorsTableServerSide from '@/pages/visitors/components/VisitorsTableServerSide';
// Simple props type
interface IndexProps {
    visits: {
        data: unknown[];                  // visits array (unknown items)
        links: unknown;                   // pagination links
        meta: Record<string, unknown>;    // Laravel meta
    };
    meta: {
        pageCount: number;
        pageIndex: number;
        pageSize: number;
        total: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Visitors',
        href: '/visitors/index',
    },
];


export default function Index({ visits, meta }: IndexProps) {
    function handleReload() {
        router.get('/visitors/index', {}, {
            onSuccess: () => {
                setTimeout(() => toast('Refreshed',{position:'top-center',duration:1000}), 0);
            },
            preserveState: false,
            preserveScroll: false,
        });
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Visitors" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 md:min-h-min dark:border-sidebar-border">
                    <VisitorsTableServerSide visits={visits} meta={meta} onRefresh={() => handleReload()} />
                </div>
            </div>
        </AppLayout>
    );
}
