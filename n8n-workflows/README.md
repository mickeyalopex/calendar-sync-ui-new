# CalendarSync n8n Workflows

## Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| CalendarSync_Setup | Handle UI webhook requests | Webhooks |
| CalendarSync_Engine | Execute sync every 5 min | Cron |
| CalendarSync_TeamShare | Auto-share work calendars | Called by Setup |

## Setup Instructions

### 1. Import CalendarSync_Setup.json

1. Open n8n: https://n8n.alopex.digital
2. Go to Workflows → Import from File
3. Select `CalendarSync_Setup.json`
4. Save the workflow

### 2. Configure Credentials

Before activating, you need to set up credentials:

#### Google Sheets Credential
1. Go to Credentials → Add Credential → Google Sheets
2. Use OAuth2 or Service Account
3. For Service Account:
   - Upload the key file: `apollo-workspace-mcp-key.json`
   - Enable "Impersonate a User" if needed

#### Google Calendar Credential
1. Go to Credentials → Add Credential → Google Calendar
2. Use Service Account with domain-wide delegation
3. Service Account: `apollo-workspace-mcp@apollo-484901.iam.gserviceaccount.com`

### 3. Update Credential IDs in Workflow

After creating credentials, update these nodes with the correct credential IDs:
- Upsert User
- Append Calendars
- Append Rules
- Get User
- Get Calendars
- Get Rules
- Verify Calendar Access

### 4. Activate the Workflow

1. Toggle the workflow to "Active"
2. Note the webhook URLs that appear:
   - `https://n8n.alopex.digital/webhook/calendar-sync/save`
   - `https://n8n.alopex.digital/webhook/calendar-sync/verify`
   - `https://n8n.alopex.digital/webhook/calendar-sync/get`

### 5. Update UI Config

Update `/config/calendar-sync-ui/config.js` with the actual webhook URLs:

```javascript
API_BASE_URL: 'https://n8n.alopex.digital/webhook',
ENDPOINTS: {
    SAVE_CONFIG: '/calendar-sync/save',
    VERIFY_CALENDAR: '/calendar-sync/verify',
    GET_CONFIG: '/calendar-sync/get'
}
```

## Webhook Endpoints

### POST /calendar-sync/save

Saves user configuration to Google Sheets.

**Request Body:**
```json
{
  "user": {
    "id": "google_user_id",
    "email": "user@alopex.digital",
    "name": "User Name"
  },
  "calendars": [
    {
      "id": "cal_xxx",
      "email": "user@alopex.digital",
      "name": "Work",
      "type": "work",
      "verified": true
    },
    {
      "id": "cal_yyy",
      "email": "personal@gmail.com",
      "name": "Personal",
      "type": "external",
      "verified": false
    }
  ],
  "rules": [
    {
      "id": "rul_xxx",
      "sourceCalId": "cal_yyy",
      "targetCalId": "cal_xxx",
      "visibility": "censored",
      "enabled": true
    }
  ],
  "teamShareEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved",
  "userId": "usr_xxx"
}
```

### POST /calendar-sync/verify

Verifies that the service account can access a shared calendar.

**Request Body:**
```json
{
  "userEmail": "user@alopex.digital",
  "calendarEmail": "personal@gmail.com"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Calendar access verified"
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "Calendar not accessible. Please check sharing settings."
}
```

### GET /calendar-sync/get?email=user@alopex.digital

Retrieves existing configuration for a user.

**Response:**
```json
{
  "user": {
    "id": "usr_xxx",
    "email": "user@alopex.digital",
    "name": "User Name"
  },
  "calendars": [...],
  "rules": [...],
  "teamShareEnabled": true
}
```

## Troubleshooting

### "Credential not found" error
- Make sure credential IDs in the workflow match your actual credentials
- Check that credentials have correct permissions

### Calendar verification fails
- User must share calendar with: `apollo-workspace-mcp@apollo-484901.iam.gserviceaccount.com`
- Permission must be "See all event details" or higher
- Service Account must have Calendar API enabled

### CORS errors in browser
- Webhook responses include `Access-Control-Allow-Origin: *` header
- If still failing, check n8n's CORS settings

## Spreadsheet ID

All workflows use this spreadsheet:
- **ID:** `1vs6MdV4mgIIqiuy837wNCPQzIj71MgjdvqpE0d0kego`
- **URL:** https://docs.google.com/spreadsheets/d/1vs6MdV4mgIIqiuy837wNCPQzIj71MgjdvqpE0d0kego
