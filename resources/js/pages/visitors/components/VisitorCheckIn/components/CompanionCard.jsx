import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { RequiredMark } from './RequiredMark';

export function CompanionCard({ index, companion, errors, onUpdate, onRemove, disabled }) {
    return (
        <div className="border rounded-lg p-3 bg-card/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                    Companion #{index + 1}
                </span>
                <Button
                    type="button"
                    onClick={onRemove}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                    disabled={disabled}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Form fields - Compact */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs">First Name <RequiredMark /></Label>
                        <Input
                            value={companion.first_name}
                            onChange={(e) => onUpdate('first_name', e.target.value)}
                            disabled={disabled}
                            placeholder="First name"
                            className="mt-1 h-10 text-sm"
                        />
                        {errors[`companions.${index}.first_name`] && (
                            <p className="text-xs text-destructive mt-1">
                                {errors[`companions.${index}.first_name`]}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="text-xs">Last Name <RequiredMark /></Label>
                        <Input
                            value={companion.last_name}
                            onChange={(e) => onUpdate('last_name', e.target.value)}
                            disabled={disabled}
                            placeholder="Last name"
                            className="mt-1 h-10 text-sm"
                        />
                        {errors[`companions.${index}.last_name`] && (
                            <p className="text-xs text-destructive mt-1">
                                {errors[`companions.${index}.last_name`]}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Label className="text-xs">
                        Person to Visit <span className="text-muted-foreground font-normal">(Change only if visiting different person)</span>
                    </Label>
                    <Input
                        value={companion.person_to_visit || ''}
                        onChange={(e) => onUpdate('person_to_visit', e.target.value)}
                        disabled={disabled}
                        placeholder="Same as group leader by default"
                        className="mt-1 h-10 text-sm"
                    />
                    {errors[`companions.${index}.person_to_visit`] && (
                        <p className="text-xs text-destructive mt-1">
                            {errors[`companions.${index}.person_to_visit`]}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
