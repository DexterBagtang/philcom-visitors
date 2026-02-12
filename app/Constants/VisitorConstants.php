<?php

namespace App\Constants;

class VisitorConstants
{
    /**
     * Predefined visitor types (excluding "Other")
     */
    public const PREDEFINED_VISITOR_TYPES = [
        'Contractor',
        'Vendor',
        'Visitor',
        'Client',
        'Delivery Personnel',
        'Applicant',
    ];

    /**
     * Predefined visit purposes (excluding "Others")
     */
    public const PREDEFINED_VISIT_PURPOSES = [
        'Official Business',
        'Meeting',
        'Delivery',
        'Collection',
        'Payment',
        'Billing',
        'Submit Documents / Requirements',
        'Interview',
        'Repair/Maintenance',
    ];
}
