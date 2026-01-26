import { useState } from 'react';
import { toTitleCase } from '../utils';

const MAX_COMPANIONS = 20;

export function useCompanions() {
    const [companions, setCompanions] = useState([]);
    const [errors, setErrors] = useState({});

    const add = (defaultPersonToVisit = '') => {
        if (companions.length >= MAX_COMPANIONS) {
            setErrors({ companions: `Maximum ${MAX_COMPANIONS} companions allowed per group` });
            return false;
        }

        setCompanions(prev => [...prev, {
            first_name: '',
            last_name: '',
            person_to_visit: defaultPersonToVisit
        }]);
        setErrors(prev => ({ ...prev, companions: '' }));
        return true;
    };

    const remove = (index) => {
        setCompanions(prev => prev.filter((_, i) => i !== index));
    };

    const update = (index, field, value) => {
        setCompanions(prev => {
            const updated = [...prev];
            updated[index][field] = field === 'person_to_visit' ? value : toTitleCase(value);
            return updated;
        });

        // Clear specific error
        setErrors(prev => ({
            ...prev,
            [`companions.${index}.${field}`]: ''
        }));
    };

    const clear = () => {
        setCompanions([]);
        setErrors({});
    };

    const clearError = (key) => {
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    return {
        companions,
        errors,
        add,
        remove,
        update,
        clear,
        setErrors,
        clearError
    };
}
