import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, X, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

interface Visit {
    id: number;
    visitor: {
        first_name: string;
        last_name: string;
        company: string;
        type: string;
        person_to_visit: string;
        visit_purpose: string;
    };
    status: string;
    check_in_time: string;
    check_out_time: string | null;
    latest_badge_assignment?: {
        badge: {
            badge_number: string;
        };
    };
    validated_by: string | null;
}

interface PreviewDialogProps {
    dateFrom?: Date;
    dateTo?: Date;
    status: string;
    includeCheckout: boolean;
    onExport: () => void;
}

export function PreviewDialog({ dateFrom, dateTo, status, includeCheckout, onExport }: PreviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<Visit[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    const handlePreview = async () => {
        setLoading(true);
        setOpen(true);

        try {
            const params: any = {};

            if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
            if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');
            if (status !== 'all') params.status = status;

            const response = await axios.post('/exports/preview', params);

            console.log(response.data);

            setPreview(response.data.preview);
            setTotalCount(response.data.total_count);

            toast.success(`Found ${response.data.total_count} records`, { position: 'top-center', duration: 2000 });
        } catch (error) {
            console.log(error);
            toast.error('Failed to load preview', { position: 'top-center' });
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            checked_in: 'bg-blue-500/10 text-blue-500',
            ongoing: 'bg-yellow-500/10 text-yellow-500',
            checked_out: 'bg-green-500/10 text-green-500',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-500';
    };

    const calculateDuration = (checkIn: string, checkOut: string | null) => {
        if (!checkOut) return '-';
        const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        return `${Math.floor(diffMins / 60)}:${(diffMins % 60).toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Button type="button" variant="outline" onClick={handlePreview} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : <><Eye className="mr-2 h-4 w-4" />Preview</>}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="!max-w-[90vw] !max-h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" />
                                Export Preview
                            </div>
                            {/*<Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">*/}
                            {/*    <X className="h-4 w-4" />*/}
                            {/*</Button>*/}
                        </DialogTitle>
                        <DialogDescription>
                            Showing first 10 records out of <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> total
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] px-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : preview.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <p className="text-lg font-medium">No records found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Person to Visit</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Badge</TableHead>
                                        <TableHead>Check-in</TableHead>
                                        {includeCheckout && (
                                            <>
                                                <TableHead>Check-out</TableHead>
                                                <TableHead>Duration</TableHead>
                                            </>
                                        )}
                                        <TableHead>Validated By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {preview.map((visit) => (
                                        <TableRow key={visit.id}>
                                            <TableCell className="font-medium">#{visit.id}</TableCell>
                                            <TableCell>
                                                <span className="font-medium">{visit.visitor.first_name} {visit.visitor.last_name}</span>
                                            </TableCell>
                                            <TableCell>{visit.visitor.company || 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{visit.visitor.type || 'N/A'}</TableCell>
                                            <TableCell>{visit.visitor.person_to_visit}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{visit.visitor.visit_purpose}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(visit.status)}>
                                                    {visit.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{visit.latest_badge_assignment?.badge?.badge_number || 'Not Assigned'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span>{format(new Date(visit.check_in_time), 'MMM dd, yyyy')}</span>
                                                    <span className="text-muted-foreground">{format(new Date(visit.check_in_time), 'hh:mm a')}</span>
                                                </div>
                                            </TableCell>
                                            {includeCheckout && (
                                                <>
                                                    <TableCell>
                                                        {visit.check_out_time ? (
                                                            <div className="flex flex-col text-xs">
                                                                <span>{format(new Date(visit.check_out_time), 'MMM dd, yyyy')}</span>
                                                                <span className="text-muted-foreground">{format(new Date(visit.check_out_time), 'hh:mm a')}</span>
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-mono">
                                                            {calculateDuration(visit.check_in_time, visit.check_out_time)}
                                                        </span>
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell>{visit.validated_by || <span className="text-muted-foreground">Not Validated</span>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>

                    <div className="flex items-center justify-between border-t p-6">
                        <div className="text-sm text-muted-foreground">
                            {totalCount > 10 && (
                                <p>Showing 10 of {totalCount.toLocaleString()} records. <span className="ml-1 font-medium text-foreground">All will be exported.</span></p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={() => { setOpen(false); onExport(); }}>
                                <Download className="mr-2 h-4 w-4" />
                                Export All {totalCount.toLocaleString()}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
