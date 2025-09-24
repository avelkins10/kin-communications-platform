# Quickbase REST Endpoints

## Core Endpoints

### Apps
- **POST** `/apps` - Create app
  - Body: `{ name, description, assignToken, securityProperties, variables }`
  - Headers: `QB-Realm-Hostname`, `Authorization: QB-USER-TOKEN {token}`

- **GET** `/apps` - List apps
- **GET** `/apps/{appId}` - Get app details
- **POST** `/apps/{appId}` - Update app

### Tables
- **POST** `/tables` - Create table
  - Body: `{ name, description, singleRecordName, pluralRecordName }`
- **GET** `/tables` - List tables
- **GET** `/tables/{tableId}` - Get table schema
- **POST** `/tables/{tableId}` - Update table

### Fields
- **POST** `/fields` - Create field
  - Body: `{ label, fieldType, properties }`
- **GET** `/fields` - List fields
- **POST** `/fields/{fieldId}` - Update field

### Records
- **POST** `/records/query` - Query records
  - Body: `{ from, select, where, sortBy, options }`
- **POST** `/records` - Create records
  - Body: `{ to, data: [{ fid_1: value, fid_2: value }] }`
- **POST** `/records` - Update records
  - Body: `{ to, data: [{ rid, fid_1: value }] }`
- **POST** `/records` - Upsert records
  - Body: `{ to, data, mergeFieldId }`
- **DELETE** `/records` - Delete records
  - Body: `{ from, where }`

### Files
- **POST** `/files` - Upload file
  - FormData: `file`, `tableId`, `fieldId`, `recordId`
- **GET** `/files/{fileId}/versions/{versionId}` - Download file

## Authentication
```typescript
const headers = {
  'Content-Type': 'application/json',
  'QB-Realm-Hostname': 'your-realm.quickbase.com',
  'Authorization': 'QB-USER-TOKEN your_token_here'
};
```

## Error Handling
- 400: Validation error
- 401: Authentication failed
- 403: Insufficient permissions
- 429: Rate limited
- 500: Server error
