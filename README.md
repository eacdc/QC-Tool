# QC Tool - Running Processes

Quality Control tool for viewing and auditing running processes in the CDC system.

## Features

- **User Authentication**: Login with username and database selection (KOL/AHM)
- **Running Processes View**: Display all currently running machines/processes
- **Process Cards**: Each card shows:
  - Process Name
  - Job Number
  - Operator Name
  - Machine Name
  - Job Name
  - Last Updated timestamp
- **Start Audit Button**: Initiate quality control audit for any running process
- **Session Management**: Persistent sessions across page refreshes and tabs
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- HTML5
- CSS3 (Custom styling with CSS variables)
- Vanilla JavaScript (ES6+)
- Backend API: CDC API (https://cdcapi.onrender.com/api)

## API Endpoints Used

- `POST /api/auth/login` - User authentication
- `POST /api/machine-status/latest` - Fetch running processes (calls `GetLatestMachineStatusPerMachine` stored procedure, returns ProcessID and JobBookingID)
- `POST /api/qc/inspection-template` - Fetch inspection template for audit (calls `GetProcessInspectionTemplate` stored procedure with actual ProcessID)
- `POST /api/qc/save-inspection` - Save completed inspection audit (calls `SaveProcessInspection` stored procedure with actual ProcessID and JobBookingID)

## File Structure

```
QC Tool/
├── index.html          # Main HTML structure
├── script.js           # JavaScript logic
├── styles.css          # Styling
└── README.md          # This file
```

## Usage

1. **Login**:
   - Enter your username
   - Select database (KOL or AHM)
   - Click "Sign In"

2. **View Running Processes**:
   - After login, see all currently running processes
   - Count badge shows total number of running processes
   - Cards are sorted by last updated time (oldest first)

3. **Start Audit**:
   - Click "Start Audit" button on any process card
   - System fetches inspection template from `GetProcessInspectionTemplate` stored procedure
   - Uses actual ProcessID from the running process data
   - Dynamic audit form is generated with all inspection parameters
   
4. **Complete Audit Form**:
   - Fill in all required inspection parameters
   - Text fields: Enter values manually
   - Combo fields: Select from dropdown options
   - All fields are mandatory
   - Click "Submit Audit" to save
   
5. **Submit Audit**:
   - System validates all required fields are filled
   - Calls `SaveProcessInspection` stored procedure with:
     - UserID: Logged in user
     - ProductionID: From `GetLatestMachineStatusPerMachine` output
     - ProcessID: From `GetLatestMachineStatusPerMachine` output
     - InspectionJson: Structured audit data (includes JobBookingID from process data)
   - Success confirmation shown
   - Returns to running processes list

## Session Management

- Sessions are stored in localStorage
- Auto-logout when new login detected in another tab
- Session restoration on page refresh

## Development

### Current Implementation

The audit workflow:

1. **Fetch Inspection Template**:
   - Calls `POST /api/qc/inspection-template` with actual ProcessID
   - Backend calls `GetProcessInspectionTemplate` stored procedure with ProcessID from process data
   - Returns inspection template with parameter definitions

2. **Generate Dynamic Form**:
   - Creates input fields based on template
   - Text Field: Creates `<input type="text">` element
   - Combo Field: Creates `<select>` dropdown with options
   - All fields are marked as required

3. **Save Inspection**:
   - Collects form data
   - Structures data according to backend requirements
   - Calls `POST /api/qc/save-inspection`
   - Backend calls `SaveProcessInspection` stored procedure

### Inspection Template Data Structure

From `GetProcessInspectionTemplate` stored procedure:

```json
[
  {
    "parameter": "Counter",
    "fieldType": "Text Field",
    "options": null
  },
  {
    "parameter": "Board Type",
    "fieldType": "Combo Field",
    "options": ["OK", "Not Ok"]
  }
]
```

Fields:
- **parameter**: Field name/label
- **fieldType**: "Text Field" or "Combo Field"
- **options**: Array of dropdown options (null for text fields)

### Audit Submission Output Format

When the audit form is submitted, the data is sent to `SaveProcessInspection` stored procedure:

**Items Array** (sent as part of InspectionJson):

```json
[
  {
    "parameter": "Counter",
    "result": "5001",
    "inputFieldType": "Text Field"
  },
  {
    "parameter": "Board Type",
    "result": "OK",
    "inputFieldType": "Combo Field",
    "defaultValue": "OK|Not Ok"
  },
  {
    "parameter": "NVZ",
    "result": "Not Ok",
    "inputFieldType": "Combo Field",
    "defaultValue": "OK|Not Ok"
  }
]
```

Where:
- **parameter**: The inspection parameter name
- **result**: The value entered/selected by the user (from form)
- **inputFieldType**: Type of field ("Text Field" or "Combo Field")
- **defaultValue**: Pipe-separated options (only for Combo Fields)

**Complete InspectionJson Structure**:

The backend receives and sends to the stored procedure:

```json
{
  "voucherPrefix": "QC",
  "companyID": 2,
  "jobBookingJobCardContentsID": 2887,
  "jobBookingID": 1869,
  "items": [
    {
      "parameter": "Counter",
      "result": "5001",
      "inputFieldType": "Text Field"
    },
    {
      "parameter": "Board Type",
      "result": "OK",
      "inputFieldType": "Combo Field",
      "defaultValue": "OK|Not Ok"
    }
  ]
}
```

**Stored Procedure Parameters**:
- `@UserID`: Logged in user ID (from session)
- `@ProductionID`: From `GetLatestMachineStatusPerMachine` output (ProductionID column)
- `@ProcessID`: From `GetLatestMachineStatusPerMachine` output (ProcessID column)
- `@InspectionJson`: The complete JSON structure above (includes JobBookingID from JobBookingID column)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- Requires active internet connection to communicate with backend API
- Session expires when logged out or when new login detected in another tab
- All timestamps are shown in the format returned by the backend

