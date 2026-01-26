import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { RequiredMark } from './RequiredMark';
import { toTitleCase } from '../utils';

export function HostVisitSection({
    data,
    errors,
    onChange,
    onClearError,
    disabled
}) {
    const isOtherPurpose = data.visit_purpose === 'Others';

    const handlePurposeChange = (value) => {
        onChange('visit_purpose', value);
        if (value !== 'Others') {
            onChange('visit_purpose_other', '');
        }
        onClearError('visit_purpose');
    };

    return (
        <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" /> Host & Visit Information
            </h2>

            {/* Person to Visit */}
            <div className="mb-4">
                <Label>Person to Visit <RequiredMark /></Label>
                <Input
                    value={data.person_to_visit}
                    onChange={(e) => onChange('person_to_visit', toTitleCase(e.target.value))}
                    disabled={disabled}
                    placeholder="Enter Person to visit"
                />
                {errors.person_to_visit && (
                    <p className="text-sm text-red-600 mt-1">{errors.person_to_visit}</p>
                )}
            </div>

            {/* Purpose of Visit */}
            <div className="mb-4">
                <Label>Purpose of Visit <RequiredMark /></Label>
                <Select
                    value={data.visit_purpose || undefined}
                    onValueChange={handlePurposeChange}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select purpose of visit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Official Business">Official Business</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                        <SelectItem value="Collection">Collection</SelectItem>
                        <SelectItem value="Payment">Payment</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Submit Documents / Requirements">Submit Documents / Requirements</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Repair/Maintenance">Repair/Maintenance</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                </Select>
                {errors.visit_purpose && (
                    <p className="text-sm text-red-600 mt-1">{errors.visit_purpose}</p>
                )}
            </div>

            {/* If "Others" selected */}
            {isOtherPurpose && (
                <div className="mb-4">
                    <Label>Specify Purpose <RequiredMark /></Label>
                    <Input
                        value={data.visit_purpose_other}
                        onChange={(e) => onChange('visit_purpose_other', toTitleCase(e.target.value))}
                        disabled={disabled}
                        placeholder="Enter custom purpose"
                    />
                    {errors.visit_purpose_other && (
                        <p className="text-sm text-red-600 mt-1">{errors.visit_purpose_other}</p>
                    )}
                </div>
            )}
        </div>
    );
}
