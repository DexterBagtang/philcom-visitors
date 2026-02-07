import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { format } from 'date-fns';

interface FilterSummaryProps {
    dateFrom?: Date;
    dateTo?: Date;
    status: string;
    visitorTypes: string[];
    visitPurposes: string[];
    onRemoveDateRange: () => void;
    onRemoveStatus: () => void;
    onRemoveVisitorType: (type: string) => void;
    onRemoveVisitPurpose: (purpose: string) => void;
    onClearAll: () => void;
}

export function FilterSummary({
    dateFrom,
    dateTo,
    status,
    visitorTypes,
    visitPurposes,
    onRemoveDateRange,
    onRemoveStatus,
    onRemoveVisitorType,
    onRemoveVisitPurpose,
    onClearAll,
}: FilterSummaryProps) {
    const hasDateRange = dateFrom || dateTo;
    const hasStatus = status !== 'all';
    const hasVisitorTypes = visitorTypes.length > 0;
    const hasVisitPurposes = visitPurposes.length > 0;
    const hasAnyFilter = hasDateRange || hasStatus || hasVisitorTypes || hasVisitPurposes;

    if (!hasAnyFilter) {
        return null;
    }

    const getDateRangeText = () => {
        if (dateFrom && dateTo) {
            if (dateFrom.getTime() === dateTo.getTime()) {
                return format(dateFrom, 'PPP');
            }
            return `${format(dateFrom, 'MMM d, yyyy')} - ${format(dateTo, 'MMM d, yyyy')}`;
        }
        if (dateFrom) {
            return `From ${format(dateFrom, 'PPP')}`;
        }
        if (dateTo) {
            return `Until ${format(dateTo, 'PPP')}`;
        }
        return '';
    };

    return (
        <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Active Filters</p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-auto px-2 py-1 text-xs"
                >
                    Clear all
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {hasDateRange && (
                    <Badge variant="secondary" className="gap-1.5">
                        <span>{getDateRangeText()}</span>
                        <button
                            type="button"
                            onClick={onRemoveDateRange}
                            className="ml-1 hover:text-destructive"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {hasStatus && (
                    <Badge variant="secondary" className="gap-1.5">
                        <span>Status: {status.replace('_', ' ')}</span>
                        <button
                            type="button"
                            onClick={onRemoveStatus}
                            className="ml-1 hover:text-destructive"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {visitorTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1.5">
                        <span>Type: {type}</span>
                        <button
                            type="button"
                            onClick={() => onRemoveVisitorType(type)}
                            className="ml-1 hover:text-destructive"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                {visitPurposes.map((purpose) => (
                    <Badge key={purpose} variant="secondary" className="gap-1.5">
                        <span>Purpose: {purpose}</span>
                        <button
                            type="button"
                            onClick={() => onRemoveVisitPurpose(purpose)}
                            className="ml-1 hover:text-destructive"
                        >
                            <XIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
}
