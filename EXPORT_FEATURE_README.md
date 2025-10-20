# Visitor Export Feature

## Overview
This feature allows you to export visitor records to Excel format with customizable date ranges, filters, and options.

## Installation
The export feature uses `maatwebsite/excel` package which is already installed in your composer.json.

If you need to reinstall it, run:
```bash
composer require maatwebsite/excel
```

## Features

### 1. **Statistics Dashboard**
- View total visits (all time)
- Today's visits count
- This week's visits
- This month's visits

### 2. **Quick Date Ranges**
Predefined date range buttons for easy selection:
- Today
- Yesterday
- This Week
- Last Week
- This Month
- Last Month
- All Records

### 3. **Custom Date Range**
- Select custom "From Date" and "To Date" using calendar pickers
- Validates that end date is not before start date
- Cannot select future dates

### 4. **Status Filters**
Export visitors based on their status:
- All Statuses
- Checked In
- Ongoing
- Checked Out

### 5. **Export Options**
- **Include Check-out Columns**: Toggle to include/exclude check-out date, time, and visit duration in the export

### 6. **Excel Export Details**
The exported Excel file includes the following columns:

#### Always Included:
- Visit ID
- First Name
- Last Name
- Company
- Visitor Type
- Person to Visit
- Purpose of Visit
- Status
- Badge Number
- Check-in Date
- Check-in Time
- Validated By
- ID Type Checked
- ID Number

#### Optional (when "Include Check-out" is enabled):
- Check-out Date
- Check-out Time
- Duration (Hours:Minutes)

### 7. **Excel Formatting**
- Professional header styling with blue background and white text
- Auto-sized columns for better readability
- Borders on header row
- Centered header text
- Sheet title shows the date range

## Usage

### Access the Export Page
1. Log in to the application
2. Click on **"Export Visitors"** in the sidebar menu
3. You'll see the export page with statistics and filter options

### Export Steps

1. **Select Date Range** (Optional)
   - Click on quick select buttons, OR
   - Use custom date pickers to select from/to dates

2. **Choose Status Filter** (Optional)
   - Select "All Statuses" or filter by specific status

3. **Configure Options**
   - Check/uncheck "Include check-out time and duration columns"

4. **Export**
   - Click "Export to Excel" button
   - Your browser will download the Excel file automatically

### File Naming Convention
Files are automatically named with the following format:
```
visitors_export_{date_range}_{status}_{timestamp}.xlsx
```

Examples:
- `visitors_export_20241020_to_20241027_all_records_20241027143052.xlsx`
- `visitors_export_from_20241001_checked_out_20241027143052.xlsx`
- `visitors_export_all_records_20241027143052.xlsx`

## Routes

### Frontend Route
```
GET /exports - Display the export page
```

### Backend Routes
```
GET /exports/download - Download the Excel file with filters
POST /exports/preview - Preview export data (optional, for future enhancements)
```

## Files Structure

```
app/
├── Exports/
│   └── VisitsExport.php          # Excel export logic
├── Http/
│   └── Controllers/
│       └── ExportController.php  # Controller handling export requests
        
resources/
└── js/
    └── pages/
        └── exports/
            └── index.tsx          # Export page UI

routes/
└── web.php                        # Routes configuration
```

## Code Components

### Backend (Laravel)

#### ExportController
- `index()` - Shows the export page with statistics
- `export()` - Generates and downloads the Excel file
- `preview()` - Returns preview data (for future use)

#### VisitsExport Class
Implements maatwebsite/excel interfaces:
- `FromQuery` - Build the query
- `WithHeadings` - Define column headers
- `WithMapping` - Map data to Excel rows
- `WithStyles` - Style the Excel file
- `WithTitle` - Set sheet title
- `WithColumnWidths` - Set column widths
- `ShouldAutoSize` - Auto-size columns

### Frontend (React/TypeScript)

#### Export Page Components
- Statistics cards displaying visit counts
- Quick date range selector buttons
- Date range pickers (from/to)
- Status dropdown filter
- Export options checkboxes
- Export button with loading state

## Customization

### Add More Filters
To add more filters, modify:
1. `ExportController@export()` - Add validation and filter logic
2. `VisitsExport@query()` - Apply the filter to the query
3. `resources/js/pages/exports/index.tsx` - Add UI controls

### Modify Excel Columns
To add/remove columns:
1. Update `VisitsExport@headings()` - Column headers
2. Update `VisitsExport@map()` - Data mapping
3. Update `VisitsExport@columnWidths()` - Column widths

### Change Excel Styling
Modify `VisitsExport@styles()` method to customize:
- Header colors
- Font styles
- Borders
- Alignment
- Cell formatting

## Troubleshooting

### Issue: Export button doesn't work
- Check browser console for JavaScript errors
- Ensure routes are properly registered
- Verify user is authenticated

### Issue: Excel file is empty
- Check if database has records matching the filters
- Review the query in `VisitsExport@query()`
- Check Laravel logs for errors

### Issue: Excel formatting is wrong
- Verify PhpSpreadsheet is properly installed
- Check `VisitsExport@styles()` method
- Ensure all required methods are implemented

### Issue: Missing columns in export
- Check `VisitsExport@headings()` array
- Verify `VisitsExport@map()` returns all values
- Ensure column widths are defined

## Future Enhancements

Potential features to add:
1. **Email Export** - Send Excel file to user's email
2. **Scheduled Exports** - Automatic exports at specified intervals
3. **Export Templates** - Save and reuse filter combinations
4. **PDF Export** - Export to PDF format
5. **CSV Export** - Export to CSV format
6. **Preview Before Export** - Show data preview before downloading
7. **Export History** - Track all export activities
8. **Custom Columns** - Let users select which columns to export
9. **Export Analytics** - Show export statistics and trends
10. **Batch Export** - Export multiple date ranges at once

## Security Considerations

- Only authenticated users can access the export feature
- Date range validation prevents invalid queries
- File downloads use proper headers and MIME types
- User permissions should be checked before exporting sensitive data

## Performance Tips

For large datasets:
- Use chunking when exporting millions of records
- Implement queue jobs for background processing
- Add progress indicators for long-running exports
- Consider implementing pagination for preview

## Support

For issues or questions:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Review browser console for JavaScript errors
3. Verify all dependencies are installed
4. Ensure database connections are working

## License

This feature is part of the PhilCom Visitors application.
