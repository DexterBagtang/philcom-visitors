import { lazy, Suspense } from 'react';

const VisitorCheckIn = lazy(()=> import('@/pages/visitors/components/VisitorCheckIn'));

export default function VisitorCheckinQr() {
    return (
        <Suspense fallback={null}>
            <VisitorCheckIn />
        </Suspense>
    );
}
