# Quickbase Environment Variables

This document describes all environment variables needed for Quickbase integration in the KIN Communications Platform.

## Required Variables

### Basic Configuration
```bash
# Quickbase realm (your Quickbase subdomain)
QUICKBASE_REALM="your-realm"

# Quickbase user token for API authentication
QUICKBASE_USER_TOKEN="your-user-token"

# Quickbase app ID or table ID (at least one is required)
QUICKBASE_APP_ID="your-app-id"
QUICKBASE_TABLE_ID="your-table-id"

# Quickbase API base URL (usually the default)
QUICKBASE_BASE_URL="https://api.quickbase.com/v1"
```

### Feature Control
```bash
# Enable/disable Quickbase integration (default: true)
QUICKBASE_ENABLED="true"  # Set to "false" to disable
```

## Communication Logging Variables

### Table Configuration
```bash
# Table ID for logging calls, SMS, and voicemails
QUICKBASE_TABLE_COMMUNICATIONS="your-communications-table-id"
```

### Field IDs for Communication Logging
```bash
# Field IDs for communication logging (adjust to match your Quickbase app)
QUICKBASE_FID_CUSTOMER="1"      # Customer reference field
QUICKBASE_FID_TYPE="2"          # Communication type (call, sms, voicemail)
QUICKBASE_FID_DIRECTION="3"     # Direction (inbound, outbound)
QUICKBASE_FID_TIMESTAMP="4"     # Timestamp of communication
QUICKBASE_FID_DURATION="5"      # Duration in seconds
QUICKBASE_FID_AGENT="6"         # Agent/user who handled it
QUICKBASE_FID_NOTES="7"         # Notes/details
QUICKBASE_FID_RECORDING="8"     # Recording URL
QUICKBASE_FID_STATUS="9"        # Status (completed, failed, missed)
```

## Project Coordinator Variables

### Table Configuration
```bash
# Table ID for project coordinator lookup
QUICKBASE_TABLE_PC="your-pc-table-id"
```

### Field IDs for Project Coordinator
```bash
# Field IDs for project coordinator lookup (adjust to match your Quickbase app)
QUICKBASE_FID_PC_ID="1"                    # Coordinator ID
QUICKBASE_FID_PC_NAME="2"                  # Coordinator name
QUICKBASE_FID_PC_EMAIL="3"                 # Coordinator email
QUICKBASE_FID_PC_PHONE="4"                 # Coordinator phone
QUICKBASE_FID_PC_AVAILABILITY="5"          # Availability status
QUICKBASE_FID_PC_ASSIGNED_CUSTOMERS="6"    # Assigned customers
QUICKBASE_FID_PC_WORKLOAD="7"              # Current workload
```

## Advanced Configuration

### Record Identification
```bash
# Field ID used for record identification (default: rid)
QUICKBASE_KEY_FID="rid"
```

### Customer Lookup Fields
```bash
# Field IDs for customer lookup (Master Requirements defaults)
QUICKBASE_FIELD_PHONE="148"                    # Phone number field
QUICKBASE_FIELD_PROJECT_COORDINATOR="346"      # Project coordinator field
QUICKBASE_FIELD_PROJECT_STATUS="255"           # Project status field
```

## Troubleshooting

### Common Issues

1. **Customer lookups fail**
   - Verify `QUICKBASE_FIELD_PHONE` (148) is correct for your app
   - Check that phone numbers are stored in the expected format

2. **Coordinator routing fails**
   - Verify `QUICKBASE_FIELD_PROJECT_COORDINATOR` (346) is correct
   - Ensure local users have matching `quickbaseUserId` values

3. **Communication logging fails**
   - Verify `QUICKBASE_TABLE_COMMUNICATIONS` is set
   - Check that all field IDs match your Quickbase app structure

4. **Authentication errors**
   - Verify `QUICKBASE_USER_TOKEN` is valid and not expired
   - Check that the token has appropriate permissions

### Disabling Quickbase

To disable Quickbase integration without breaking the app:
```bash
QUICKBASE_ENABLED="false"
```

This will:
- Skip all Quickbase lookups and logging
- Continue normal call handling and routing
- Log warnings about disabled integration

### Monitoring

Check Sentry for Quickbase error breadcrumbs:
- Look for `category: 'quickbase'` breadcrumbs
- Monitor for authentication failures
- Track communication logging success/failure rates

## Example .env Configuration

```bash
# Quickbase Configuration
QUICKBASE_REALM="kincommunications"
QUICKBASE_APP_ID="abc123def456"
QUICKBASE_USER_TOKEN="QB-USER-TOKEN-abc123def456"
QUICKBASE_BASE_URL="https://api.quickbase.com/v1"
QUICKBASE_ENABLED="true"

# Communication Logging
QUICKBASE_TABLE_COMMUNICATIONS="tbl123456"
QUICKBASE_FID_CUSTOMER="1"
QUICKBASE_FID_TYPE="2"
QUICKBASE_FID_DIRECTION="3"
QUICKBASE_FID_TIMESTAMP="4"
QUICKBASE_FID_DURATION="5"
QUICKBASE_FID_AGENT="6"
QUICKBASE_FID_NOTES="7"
QUICKBASE_FID_RECORDING="8"
QUICKBASE_FID_STATUS="9"

# Project Coordinator
QUICKBASE_TABLE_PC="tbl789012"
QUICKBASE_FID_PC_ID="1"
QUICKBASE_FID_PC_NAME="2"
QUICKBASE_FID_PC_EMAIL="3"
QUICKBASE_FID_PC_PHONE="4"
QUICKBASE_FID_PC_AVAILABILITY="5"
QUICKBASE_FID_PC_ASSIGNED_CUSTOMERS="6"
QUICKBASE_FID_PC_WORKLOAD="7"
```
