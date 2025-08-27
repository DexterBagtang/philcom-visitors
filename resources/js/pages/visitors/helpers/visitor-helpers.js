export function getAvatarColor(visitorType) {
    if (!visitorType) return 'bg-gradient-to-br from-gray-400 to-gray-600';

    const colorMap = {
        'Visitor': 'bg-gradient-to-br from-blue-400 to-blue-600',
        'Client': 'bg-gradient-to-br from-purple-400 to-purple-600',
        'Contractor': 'bg-gradient-to-br from-green-400 to-green-600',
        'Vendor': 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        'Applicant': 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        'Delivery Personnel': 'bg-gradient-to-br from-red-400 to-red-600',
        'Other': 'bg-gradient-to-br from-gray-400 to-gray-600'
    };

    return colorMap[visitorType] || 'bg-gradient-to-br from-gray-400 to-gray-600';
}
