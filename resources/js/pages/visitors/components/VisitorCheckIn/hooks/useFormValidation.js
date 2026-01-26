import { useState } from 'react';

export function useFormValidation() {
    const [errors, setErrors] = useState({});

    const validate = (data, companions) => {
        const newErrors = {};

        // First name
        if (!data.first_name.trim()) {
            newErrors.first_name = "Name is required.";
        } else if (data.first_name.length > 255) {
            newErrors.first_name = "Name cannot exceed 255 characters.";
        }

        // Last name
        if (!data.last_name.trim()) {
            newErrors.last_name = "Name is required.";
        } else if (data.last_name.length > 255) {
            newErrors.last_name = "Name cannot exceed 255 characters.";
        }

        // Company - required for group check-in
        if (companions.length > 0) {
            if (!data.company || !data.company.trim()) {
                newErrors.company = "Company/Organization is required for group check-in.";
            } else if (data.company.length > 255) {
                newErrors.company = "Company cannot exceed 255 characters.";
            }
        } else {
            if (data.company && data.company.length > 255) {
                newErrors.company = "Company cannot exceed 255 characters.";
            }
        }

        // Person to visit
        if (!data.person_to_visit.trim()) {
            newErrors.person_to_visit = "Person to visit is required.";
        } else if (data.person_to_visit.length > 255) {
            newErrors.person_to_visit = "Person to visit cannot exceed 255 characters.";
        }

        // Visit purpose
        if (!data.visit_purpose.trim()) {
            newErrors.visit_purpose = "Purpose of visit is required.";
        } else if (data.visit_purpose.length > 1000) {
            newErrors.visit_purpose = "Purpose cannot exceed 1000 characters.";
        }

        if (data.visit_purpose === "Others") {
            if (!data.visit_purpose_other.trim()) {
                newErrors.visit_purpose_other = "Please specify the purpose.";
            } else if (data.visit_purpose_other.length > 255) {
                newErrors.visit_purpose_other = "Custom purpose cannot exceed 255 characters.";
            }
        }

        // Visitor type
        if (!data.visitor_type.trim()) {
            newErrors.visitor_type = "Visitor type is required.";
        }

        if (data.visitor_type === "Other") {
            if (!data.visitor_type_other.trim()) {
                newErrors.visitor_type_other = "Please specify the visitor type.";
            } else if (data.visitor_type_other.length > 255) {
                newErrors.visitor_type_other = "Custom visitor type cannot exceed 255 characters.";
            }
        }

        // Validate companions
        companions.forEach((companion, index) => {
            if (!companion.first_name?.trim()) {
                newErrors[`companions.${index}.first_name`] = "First name is required.";
            }
            if (!companion.last_name?.trim()) {
                newErrors[`companions.${index}.last_name`] = "Last name is required.";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearError = (key) => {
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const clear = () => {
        setErrors({});
    };

    return {
        errors,
        validate,
        clearError,
        clear,
        setErrors
    };
}
