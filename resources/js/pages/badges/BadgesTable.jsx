'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, BadgeCheckIcon, CheckCircle2, Clock, MapPin, Search, UserCheck } from 'lucide-react';
import { useState } from 'react';
import BadgeAssignedDialog from '@/pages/badges/BadgeAssignedDialog.jsx';

export default function BadgesTable({ badges }) {
    const [searchInput, setSearchInput] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [open, setOpen] = useState(false);

    const handleSort = () => {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    // Filter and sort logic
    const filteredBadges = badges
        .filter(
            (badge) =>
                badge.badge_number.toLowerCase().includes(searchInput.toLowerCase()) ||
                badge.status.toLowerCase().includes(searchInput.toLowerCase()) ||
                badge.location.toLowerCase().includes(searchInput.toLowerCase()),
        )
        .sort((a, b) => {
            const numA = a.badge_number.toLowerCase();
            const numB = b.badge_number.toLowerCase();
            return sortOrder === 'asc' ? numA.localeCompare(numB) : numB.localeCompare(numA);
        });

    const handleDialog = (badge) => {
        setSelectedBadge(badge);
        setOpen(true);
    };

    // Status icon and color mapping
    const getStatusUI = (badge) => {
        const status = badge.status.toLowerCase();
        switch (status) {
            case 'available':
                return (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700 text-xs">
                            {badge.status}
                        </Badge>
                    </div>
                );
            case 'assigned':
                return (
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                        onClick={() => handleDialog(badge)}
                    >
                        <UserCheck className="h-4 w-4 text-red-500" />
                        <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700 text-xs">
                            {badge.status}
                        </Badge>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-700 text-xs">
                            {badge.status}
                        </Badge>
                    </div>
                );
        }
    };

    return (
        <>
            <Card className="w-full rounded-xl border border-gray-200 shadow-md">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <BadgeCheckIcon className="h-5 w-5 text-gray-600" />
                        Badge Records
                    </CardTitle>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search by number, status, or location..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="rounded-lg pl-10 pr-4 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-700 text-sm">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
                                            onClick={handleSort}
                                        >
                                            Badge No.
                                            <ArrowUpDown className="h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-sm">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-sm">Location</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-sm">Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBadges.length > 0 ? (
                                    filteredBadges.map((badge, idx) => (
                                        <TableRow
                                            key={badge.id}
                                            className={`${
                                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            } transition hover:bg-gray-100`}
                                        >
                                            <TableCell className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={badge.badge_number}>
                                                {badge.badge_number}
                                            </TableCell>
                                            <TableCell>{getStatusUI(badge)}</TableCell>
                                            <TableCell className="text-sm text-gray-700 truncate max-w-[200px]" title={badge.location}>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                    {badge.location}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {new Date(badge.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-gray-500 italic">
                                            No badges found 🚫
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <BadgeAssignedDialog badge={selectedBadge} isOpen={open} onOpenChange={setOpen} />
        </>
    );
}
