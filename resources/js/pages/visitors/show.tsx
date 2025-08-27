import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import VisitorShowPage from '@/pages/visitors/components/VisitorShowPage';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Visitors',
        href: '/visitors/index',
    },
];

interface ShowVisitorProps {
    visit: unknown[];
    from: string;
}

export default function ShowVisitor({ visit,from }: ShowVisitorProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Visitors" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 md:min-h-min dark:border-sidebar-border">
                    <VisitorShowPage visit={visit} from={from} />
                </div>
            </div>
        </AppLayout>
    );
}
