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
- `POST /api/machine-status/latest` - Fetch running processes (calls `GetLatestMachineStatusPerMachine` stored procedure)
- `POST /api/qc/inspection-template` - Fetch inspection template for audit (calls `GetProcessInspectionTemplate` stored procedure with ProcessID 10337)

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
   - Currently uses hardcoded ProcessID 10337 as per requirement
   - Displays inspection template data in console and alert
   - Shows number of inspection items and first few items

## Session Management

- Sessions are stored in localStorage
- Auto-logout when new login detected in another tab
- Session restoration on page refresh

## Development

### Current Implementation

The "Start Audit" button currently:
1. Calls `POST /api/qc/inspection-template` with the database selection
2. Backend calls `GetProcessInspectionTemplate` stored procedure with ProcessID 10337 (hardcoded)
3. Returns inspection template data
4. Displays summary in an alert and logs full data to console

### Next Steps for Full Audit Form

To create a full audit form UI, modify the `handleStartAudit` function in `script.js`:

```javascript
async function handleStartAudit(process) {
  // Current implementation fetches inspection template
  const inspectionData = await fetchInspectionTemplate(processId);
  
  // TODO: Create inspection form UI
  // - Display each inspection item
  // - Add input fields for measurements/checks
  // - Add pass/fail buttons
  // - Add remarks field
  // - Add submit button to save audit results
}
```

The inspection template data structure will include fields like:
- parameter: Field name
- fieldType: "Text Field" or "Combo Field"
- options: Array of dropdown options (for Combo Fields)

### Audit Submission Output Format

When the audit form is submitted, the data is structured as:

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

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- Requires active internet connection to communicate with backend API
- Session expires when logged out or when new login detected in another tab
- All timestamps are shown in the format returned by the backend

