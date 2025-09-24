# Twilio OpenAPI Specifications

This directory contains the complete OpenAPI 3.0 specifications for all Twilio APIs, providing comprehensive type definitions and API documentation.

## Available Specifications

### Core APIs
- `twilio_api_v2010.yaml` - Main Twilio API v2010 (Calls, Messages, Accounts, etc.)
- `twilio_accounts_v1.yaml` - Account management API
- `twilio_oauth_v1.yaml` - OAuth authentication API
- `twilio_oauth_v2.yaml` - OAuth v2 authentication API

### Communication APIs
- `twilio_voice_v1.yaml` - Voice API (calls, recordings, transcriptions)
- `twilio_messaging_v1.yaml` - Messaging API v1
- `twilio_messaging_v2.yaml` - Messaging API v2
- `twilio_video_v1.yaml` - Video API
- `twilio_conversations_v1.yaml` - Conversations API

### TaskRouter & Workforce Management
- `twilio_taskrouter_v1.yaml` - TaskRouter API (workspaces, workers, tasks, activities)
- `twilio_flex_v1.yaml` - Flex API v1
- `twilio_flex_v2.yaml` - Flex API v2

### Other Services
- `twilio_verify_v2.yaml` - Verify API v2
- `twilio_verify_v3.yaml` - Verify API v3
- `twilio_studio_v1.yaml` - Studio API v1
- `twilio_studio_v2.yaml` - Studio API v2
- `twilio_sync_v1.yaml` - Sync API
- `twilio_lookups_v1.yaml` - Lookups API v1
- `twilio_lookups_v2.yaml` - Lookups API v2

## Key Schema Definitions

### Account Schema
```yaml
api.v2010.account:
  type: object
  properties:
    sid:
      type: string
      pattern: ^AC[0-9a-fA-F]{32}$
      description: A 34 character string that uniquely identifies this resource
    auth_token:
      type: string
      description: The authorization token for this account
    friendly_name:
      type: string
      description: A human readable description of this account
    status:
      $ref: '#/components/schemas/account_enum_status'
    type:
      $ref: '#/components/schemas/account_enum_type'
```

### Call Schema (Voice API)
```yaml
voice.v1.call:
  type: object
  properties:
    sid:
      type: string
      pattern: ^CA[0-9a-fA-F]{32}$
      description: The unique string that identifies this resource
    from:
      type: string
      description: The phone number, SIP address, or client identifier that made this call
    to:
      type: string
      description: The phone number, SIP address, or client identifier that received this call
    status:
      $ref: '#/components/schemas/call_enum_status'
    direction:
      $ref: '#/components/schemas/call_enum_direction'
    duration:
      type: integer
      description: The length of the call in seconds
    price:
      type: string
      description: The charge for this call
    price_unit:
      type: string
      description: The currency in which price is measured
```

### TaskRouter Worker Schema
```yaml
taskrouter.v1.workspace.worker:
  type: object
  properties:
    sid:
      type: string
      pattern: ^WK[0-9a-fA-F]{32}$
      description: The unique string that identifies the resource
    friendly_name:
      type: string
      description: The string that you assigned to describe the Worker resource
    attributes:
      type: string
      description: The JSON string that describes the Worker
    activity_sid:
      type: string
      pattern: ^WA[0-9a-fA-F]{32}$
      description: The SID of the Activity that describes the Worker's current state
    activity_name:
      type: string
      description: The friendly_name of the Activity that describes the Worker's current state
    available:
      type: boolean
      description: Whether the Worker is available to take on Tasks
```

### TaskRouter Task Schema
```yaml
taskrouter.v1.workspace.task:
  type: object
  properties:
    sid:
      type: string
      pattern: ^WT[0-9a-fA-F]{32}$
      description: The unique string that identifies the resource
    attributes:
      type: string
      description: The JSON string that describes the Task
    assignment_status:
      $ref: '#/components/schemas/task_enum_assignment_status'
    priority:
      type: integer
      description: The current priority score of the Task as assigned to a Worker
    age:
      type: integer
      description: The age of the Task in seconds
    timeout:
      type: integer
      description: The number of seconds the Task is allowed to live
    workflow_sid:
      type: string
      pattern: ^WW[0-9a-fA-F]{32}$
      description: The SID of the Workflow that is controlling the Task
    workflow_friendly_name:
      type: string
      description: The friendly name of the Workflow that is controlling the Task
    queue_sid:
      type: string
      pattern: ^WQ[0-9a-fA-F]{32}$
      description: The SID of the TaskQueue that is currently handling the Task
    queue_friendly_name:
      type: string
      description: The friendly name of the TaskQueue that is currently handling the Task
```

## Authentication

All APIs use HTTP Basic Authentication with Account SID and Auth Token:

```yaml
securitySchemes:
  accountSid_authToken:
    scheme: basic
    type: http
```

## Common Response Patterns

### Success Response
```yaml
200:
  description: OK
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/resource_schema'
```

### Error Response
```yaml
400:
  description: Bad Request
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/error_schema'
```

## TypeScript Integration

These OpenAPI specifications can be used to generate TypeScript types:

```bash
# Using openapi-generator
npx @openapitools/openapi-generator-cli generate \
  -i twilio_api_v2010.yaml \
  -g typescript-axios \
  -o ./generated/typescript

# Using swagger-codegen
swagger-codegen generate \
  -i twilio_api_v2010.yaml \
  -l typescript-axios \
  -o ./generated/typescript
```

## Key Endpoints for KIN Platform

### Voice API Endpoints
- `POST /2010-04-01/Accounts/{AccountSid}/Calls.json` - Create outbound call
- `GET /2010-04-01/Accounts/{AccountSid}/Calls/{Sid}.json` - Get call details
- `POST /2010-04-01/Accounts/{AccountSid}/Calls/{Sid}.json` - Update call
- `DELETE /2010-04-01/Accounts/{AccountSid}/Calls/{Sid}.json` - Hangup call

### TaskRouter Endpoints
- `GET /v1/Workspaces/{WorkspaceSid}/Workers` - List workers
- `POST /v1/Workspaces/{WorkspaceSid}/Workers` - Create worker
- `GET /v1/Workspaces/{WorkspaceSid}/Workers/{Sid}` - Get worker
- `POST /v1/Workspaces/{WorkspaceSid}/Workers/{Sid}` - Update worker
- `GET /v1/Workspaces/{WorkspaceSid}/Tasks` - List tasks
- `POST /v1/Workspaces/{WorkspaceSid}/Tasks` - Create task
- `GET /v1/Workspaces/{WorkspaceSid}/Tasks/{Sid}` - Get task
- `POST /v1/Workspaces/{WorkspaceSid}/Tasks/{Sid}` - Update task

## Rate Limiting

All APIs implement rate limiting with the following headers:
- `X-Rate-Limit-Limit` - The rate limit ceiling for that given request
- `X-Rate-Limit-Remaining` - The number of requests left for the 15 minute window
- `X-Rate-Limit-Reset` - The time at which the current rate limit window resets

## Webhook Signatures

Webhook requests include a signature header for verification:
- `X-Twilio-Signature` - HMAC-SHA1 signature of the request

## Best Practices

1. **Use HTTPS**: All API requests must use HTTPS
2. **Handle Rate Limits**: Implement exponential backoff for rate limit errors
3. **Validate Webhooks**: Always verify webhook signatures
4. **Use Pagination**: For list endpoints, use pagination parameters
5. **Error Handling**: Implement comprehensive error handling for all status codes
6. **Type Safety**: Use generated TypeScript types for better development experience
