import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { User } from "lucide-react";
import { RequiredMark } from './RequiredMark';
import { toTitleCase } from '../utils';

export function VisitorDetailsSection({
    data,
    errors,
    hasCompanions,
    onChange,
    onClearError,
    disabled
}) {
    const isOtherType = data.visitor_type === 'Other';

    const handleVisitorTypeChange = (value) => {
        onChange('visitor_type', value);
        if (value !== 'Other') {
            onChange('visitor_type_other', '');
        }
        onClearError('visitor_type');
    };

    return (
        <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-primary" /> Your Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* First Name */}
                <div>
                    <Label>First Name <RequiredMark /></Label>
                    <Input
                        value={data.first_name}
                        onChange={(e) => onChange('first_name', toTitleCase(e.target.value))}
                        disabled={disabled}
                        placeholder="Enter First Name"
                    />
                    {errors.first_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                    )}
                </div>

                {/* Last Name */}
                <div>
                    <Label>Last Name <RequiredMark /></Label>
                    <Input
                        value={data.last_name}
                        onChange={(e) => onChange('last_name', toTitleCase(e.target.value))}
                        disabled={disabled}
                        placeholder="Enter Last Name"
                    />
                    {errors.last_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                    )}
                </div>

                {/* Company */}
                <div>
                    <Label>
                        Company/Organization
                        {hasCompanions && <RequiredMark />}
                    </Label>
                    <Input
                        value={data.company}
                        onChange={(e) => onChange('company', toTitleCase(e.target.value))}
                        disabled={disabled}
                        placeholder="Enter Company/Organization"
                    />
                    {errors.company && (
                        <p className="text-sm text-red-600 mt-1">{errors.company}</p>
                    )}
                </div>

                {/* Visitor Type */}
                <div>
                    <Label>Visitor Type <RequiredMark /></Label>
                    <Select
                        value={data.visitor_type || undefined}
                        onValueChange={handleVisitorTypeChange}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select visitor type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Contractor">Contractor</SelectItem>
                            <SelectItem value="Vendor">Vendor</SelectItem>
                            <SelectItem value="Visitor">Visitor</SelectItem>
                            <SelectItem value="Client">Client</SelectItem>
                            <SelectItem value="Delivery Personnel">Delivery Personnel</SelectItem>
                            <SelectItem value="Applicant">Applicant</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.visitor_type && (
                        <p className="text-sm text-red-600 mt-1">{errors.visitor_type}</p>
                    )}
                </div>

                {/* If "Other" selected */}
                {isOtherType && (
                    <div className="mb-4">
                        <Label>Specify Visitor Type <RequiredMark /></Label>
                        <Input
                            value={data.visitor_type_other}
                            onChange={(e) => onChange('visitor_type_other', toTitleCase(e.target.value))}
                            disabled={disabled}
                            placeholder="Enter custom visitor type"
                        />
                        {errors.visitor_type_other && (
                            <p className="text-sm text-red-600 mt-1">{errors.visitor_type_other}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
