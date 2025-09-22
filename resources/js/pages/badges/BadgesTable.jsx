import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    ArrowUpDown,
    Badge as BadgeIcon,
    CheckCircle2,
    Clock,
    Edit,
    MapPin,
    Plus,
    Search,
    Trash2,
    UserCheck,
    Filter,
    MoreVertical,
    Eye
} from 'lucide-react';
import { useState, useMemo } from 'react';
import BadgeAssignedDialog from '@/pages/badges/BadgeAssignedDialog.jsx';
import BadgeFormDialog from '@/pages/badges/BadgeFormDialog.jsx';
import { router } from '@inertiajs/react';

// Constants for better maintainability
const BADGE_STATUS = {
    AVAILABLE: 'available',
    ASSIGNED: 'assigned',
    PENDING: 'pending'
};

const SORT_OPTIONS = {
    ASC: 'asc',
    DESC: 'desc'
};

// Custom hooks for better separation of concerns
const useBadgeFiltering = (badges, searchInput) => {
    return useMemo(() => {
        if (!searchInput.trim()) return badges;

        const searchTerm = searchInput.toLowerCase().trim();
        return badges.filter(badge =>
            badge.badge_number.toLowerCase().includes(searchTerm) ||
            badge.status.toLowerCase().includes(searchTerm) ||
            badge.location.toLowerCase().includes(searchTerm)
        );
    }, [badges, searchInput]);
};

const useBadgeSorting = (badges, sortOrder) => {
    return useMemo(() => {
        return [...badges].sort((a, b) => {
            const comparison = a.badge_number.toLowerCase().localeCompare(b.badge_number.toLowerCase());
            return sortOrder === SORT_OPTIONS.ASC ? comparison : -comparison;
        });
    }, [badges, sortOrder]);
};

// Component for status display with improved accessibility
const BadgeStatusDisplay = ({ badge, onAssignedClick }) => {
    const status = badge.status.toLowerCase();

    const statusConfigs = {
        [BADGE_STATUS.AVAILABLE]: {
            icon: CheckCircle2,
            iconColor: 'text-emerald-500',
            badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            label: 'Available'
        },
        [BADGE_STATUS.ASSIGNED]: {
            icon: UserCheck,
            iconColor: 'text-rose-500',
            badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
            label: 'Assigned',
            clickable: true
        },
        default: {
            icon: Clock,
            iconColor: 'text-amber-500',
            badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
            label: badge.status
        }
    };

    const config = statusConfigs[status] || statusConfigs.default;
    const Icon = config.icon;

    return (
        <div
            className={`flex items-center gap-2 ${
                config.clickable
                    ? 'cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors duration-200'
                    : ''
            }`}
            onClick={config.clickable ? () => onAssignedClick(badge) : undefined}
            role={config.clickable ? 'button' : undefined}
            tabIndex={config.clickable ? 0 : undefined}
            onKeyDown={config.clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAssignedClick(badge);
                }
            } : undefined}
            aria-label={config.clickable ? `View assignment details for badge ${badge.badge_number}` : undefined}
        >
            <Icon className={`h-4 w-4 ${config.iconColor}`} aria-hidden="true" />
            <Badge variant="outline" className={`${config.badgeClass} text-xs font-medium`}>
                {config.label}
            </Badge>
        </div>
    );
};

// Action buttons component
const BadgeActions = ({ badge, onEdit, onDelete, onView }) => {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete badge ${badge.badge_number}? This action cannot be undone.`)) {
            router.delete(`/badges/${badge.id}`, {
                onSuccess: () => {
                    // You might want to show a success toast here
                    console.log('Badge deleted successfully');
                },
                onError: (errors) => {
                    // You might want to show an error toast here
                    console.error('Error deleting badge:', errors);
                }
            });
        }
    };

    return (
        <div className="flex items-center gap-1" role="group" aria-label={`Actions for badge ${badge.badge_number}`}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(badge)}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-200"
                aria-label={`View badge ${badge.badge_number}`}
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(badge)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-200"
                aria-label={`Edit badge ${badge.badge_number}`}
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
                aria-label={`Delete badge ${badge.badge_number}`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

// Empty state component
const EmptyState = ({ hasSearchQuery, onClearSearch, onAddBadge }) => (
    <TableRow>
        <TableCell colSpan={5} className="h-32">
            <div className="flex flex-col items-center justify-center text-center py-8">
                <BadgeIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {hasSearchQuery ? 'No badges found' : 'No badges yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                    {hasSearchQuery
                        ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                        : 'Get started by creating your first badge record.'
                    }
                </p>
                <div className="flex gap-2">
                    {hasSearchQuery && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearSearch}
                            className="text-gray-700"
                        >
                            Clear search
                        </Button>
                    )}
                    <Button
                        onClick={onAddBadge}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Badge
                    </Button>
                </div>
            </div>
        </TableCell>
    </TableRow>
);

// Main component
export default function BadgesTable({ badges = [] }) {
    // State management
    const [searchInput, setSearchInput] = useState('');
    const [sortOrder, setSortOrder] = useState(SORT_OPTIONS.ASC);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [assignedDialogOpen, setAssignedDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);

    // Apply filtering and sorting
    const filteredBadges = useBadgeFiltering(badges, searchInput);
    const sortedBadges = useBadgeSorting(filteredBadges, sortOrder);

    // Event handlers
    const handleSort = () => {
        setSortOrder(prev => prev === SORT_OPTIONS.ASC ? SORT_OPTIONS.DESC : SORT_OPTIONS.ASC);
    };

    const handleAssignedDialog = (badge) => {
        setSelectedBadge(badge);
        setAssignedDialogOpen(true);
    };

    const handleAddBadge = () => {
        setEditingBadge(null);
        setFormDialogOpen(true);
    };

    const handleEditBadge = (badge) => {
        setEditingBadge(badge);
        setFormDialogOpen(true);
    };

    const handleViewBadge = (badge) => {
        // You might want to navigate to a detail view or open a read-only dialog
        console.log('View badge:', badge);
    };

    const clearSearch = () => {
        setSearchInput('');
    };

    // Statistics for better UX
    const totalBadges = badges.length;
    const availableBadges = badges.filter(b => b.status.toLowerCase() === BADGE_STATUS.AVAILABLE).length;
    const assignedBadges = badges.filter(b => b.status.toLowerCase() === BADGE_STATUS.ASSIGNED).length;

    return (
        <>
            <Card className="w-full rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-4">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <BadgeIcon className="h-6 w-6 text-blue-600" />
                            Badge Management
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            {totalBadges} total • {availableBadges} available • {assignedBadges} assigned
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                            <Input
                                type="search"
                                placeholder="Search badges..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="rounded-lg pl-10 pr-4 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                aria-label="Search badges by number, status, or location"
                            />
                        </div>
                        <Button
                            onClick={handleAddBadge}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="h-4 w-4" />
                            Add Badge
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-2">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <Table>
                            <TableHeader className="bg-gray-50/80">
                                <TableRow className="hover:bg-gray-50">
                                    <TableHead className="font-semibold text-gray-800 text-sm">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 text-gray-800 hover:text-gray-900 hover:bg-gray-100 -ml-2"
                                            onClick={handleSort}
                                            aria-label={`Sort by badge number ${sortOrder === SORT_OPTIONS.ASC ? 'descending' : 'ascending'}`}
                                        >
                                            Badge Number
                                            <ArrowUpDown className="h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-800 text-sm">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-800 text-sm">Location</TableHead>
                                    <TableHead className="font-semibold text-gray-800 text-sm">Created</TableHead>
                                    <TableHead className="font-semibold text-gray-800 text-sm">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBadges.length > 0 ? (
                                    sortedBadges.map((badge, idx) => (
                                        <TableRow
                                            key={badge.id}
                                            className={`${
                                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                            } hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100`}
                                        >
                                            <TableCell className="font-mono font-medium text-gray-900 text-sm">
                        <span
                            className="truncate block max-w-[120px]"
                            title={badge.badge_number}
                        >
                          {badge.badge_number}
                        </span>
                                            </TableCell>

                                            <TableCell>
                                                <BadgeStatusDisplay
                                                    badge={badge}
                                                    onAssignedClick={handleAssignedDialog}
                                                />
                                            </TableCell>

                                            <TableCell className="text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
                                                    <span
                                                        className="truncate block max-w-[150px]"
                                                        title={badge.location}
                                                    >
                            {badge.location}
                          </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm text-gray-600">
                                                <time dateTime={badge.created_at}>
                                                    {new Date(badge.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </time>
                                            </TableCell>

                                            <TableCell>
                                                <BadgeActions
                                                    badge={badge}
                                                    onEdit={handleEditBadge}
                                                    onDelete={() => {}} // Handled internally
                                                    onView={handleViewBadge}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <EmptyState
                                        hasSearchQuery={searchInput.trim().length > 0}
                                        onClearSearch={clearSearch}
                                        onAddBadge={handleAddBadge}
                                    />
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Results summary */}
                    {searchInput.trim() && sortedBadges.length > 0 && (
                        <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
              <span>
                Showing {sortedBadges.length} of {totalBadges} badges
              </span>
                            {searchInput.trim() && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSearch}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <BadgeAssignedDialog
                badge={selectedBadge}
                isOpen={assignedDialogOpen}
                onOpenChange={setAssignedDialogOpen}
            />

            <BadgeFormDialog
                badge={editingBadge}
                isOpen={formDialogOpen}
                onOpenChange={setFormDialogOpen}
            />
        </>
    );
}
