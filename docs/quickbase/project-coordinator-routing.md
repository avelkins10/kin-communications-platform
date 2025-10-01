# Project Coordinator Routing

This document explains how the KIN Communications Platform routes calls directly to project coordinators based on customer data from QuickBase.

## Overview

When a customer calls, the system:
1. Looks up the customer in QuickBase by phone number
2. Retrieves their assigned project coordinator
3. Routes the call directly to that coordinator (if available)
4. Falls back to department-based routing if coordinator is unavailable

## How It Works

### 1. Customer Lookup

When an incoming call is received, the routing engine performs a QuickBase lookup:

```typescript
// src/lib/twilio/routing.ts
const quickbaseResult = await this.getQuickbaseRouting(phoneNumber);
```

This returns customer information including:
- Customer ID
- Project coordinator ID
- Department
- Priority level

### 2. Project Coordinator Resolution

If a project coordinator is found, the system looks up the corresponding worker:

```typescript
const coordinatorWorker = await this.findWorkerByProjectCoordinator(
  quickbaseResult.projectCoordinator
);
```

The system matches the QuickBase `projectCoordinatorId` to a user's `quickbaseUserId` field, then finds their associated worker record.

### 3. Task Attribute Enhancement

The task attributes are enhanced with routing information:

```typescript
enhancedAttributes.preferred_worker_sid = coordinatorWorker.twilioWorkerSid;
enhancedAttributes.routing_type = "project_coordinator";
enhancedAttributes.project_coordinator = quickbaseResult.projectCoordinator;
```

### 4. Priority Boost

Calls routed to project coordinators receive a priority boost:

```typescript
priority = Math.max(priority, 85); // Boost to 85 out of 100
```

This ensures these calls are handled quickly, even during busy periods.

## Workflow Configuration

To enable project coordinator routing, your Twilio workflow must check for the `preferred_worker_sid` attribute.

### Recommended Workflow Structure

```json
{
  "task_routing": {
    "filters": [
      {
        "expression": "preferred_worker_sid != null AND worker.sid == preferred_worker_sid AND worker.activity.available == true",
        "targets": [
          {
            "queue": "WQxxxx", // Any queue
            "expression": "worker.sid == task.preferred_worker_sid",
            "priority": 999,
            "timeout": 30
          }
        ]
      },
      {
        "expression": "department == 'permits'",
        "targets": [
          {
            "queue": "WQxxxx" // Permits queue
          }
        ]
      }
    ],
    "default_filter": {
      "queue": "WQxxxx" // Default queue
    }
  }
}
```

### Filter Priority Order

1. **Project Coordinator Route** (Highest Priority)
   - Checks if `preferred_worker_sid` is set
   - Routes to that specific worker if they're available
   - Times out after 30 seconds and moves to next filter

2. **Department-Based Route** (Medium Priority)
   - Routes based on `department` attribute
   - Uses department-specific task queues

3. **Default Route** (Fallback)
   - Catches all tasks that don't match above filters
   - Routes to general support queue

## Task Attributes Reference

When project coordinator routing is active, tasks will have these attributes:

```typescript
{
  // Customer information
  customer_id: "qb_customer_123",
  customer_phone: "+15551234567",
  customer_name: "John Doe",

  // Project coordinator routing
  project_coordinator: "qb_user_456", // QuickBase coordinator ID
  preferred_worker_sid: "WKxxxx",     // Twilio worker SID
  routing_type: "project_coordinator", // Routing method used

  // Standard routing attributes
  department: "installations",
  priority: "high",
  keywords: ["urgent", "inspection"]
}
```

## Database Schema Requirements

### User Table

Users must have a `quickbaseUserId` field to link QuickBase coordinators to system users:

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  quickbaseUserId String?   @unique // Links to QuickBase project coordinator
  twilioWorkerSid String?   @unique
  Worker          Worker?
}
```

### Worker Table

Workers are linked to users through the `userId` foreign key:

```prisma
model Worker {
  id               String   @id @default(cuid())
  userId           String   @unique
  twilioWorkerSid  String   @unique
  friendlyName     String
  activitySid      String?
  available        Boolean  @default(false)
  user             User     @relation(fields: [userId], references: [id])
}
```

## Setup Instructions

### 1. Sync QuickBase Users

Ensure all project coordinators in QuickBase have corresponding user accounts:

```typescript
// Create user with QuickBase ID
await prisma.user.create({
  data: {
    email: "coordinator@example.com",
    name: "Jane Coordinator",
    quickbaseUserId: "qb_user_456", // From QuickBase
    role: "employee"
  }
});
```

### 2. Create TaskRouter Workers

Each coordinator needs a TaskRouter worker:

```typescript
// Create worker for the user
const worker = await taskRouterService.createWorker({
  friendlyName: "Jane Coordinator",
  attributes: {
    skills: ["installations", "customer_support"],
    department: "operations"
  },
  activitySid: availableActivitySid
}, userId);
```

### 3. Update Workflow Configuration

In the Twilio Console:

1. Go to TaskRouter > Workflows
2. Select your workflow
3. Add the project coordinator filter at the top of your routing configuration
4. Save the workflow

### 4. Test the Integration

1. **Create a test customer in QuickBase** with a project coordinator assigned
2. **Make a test call** from the customer's phone number
3. **Verify routing** - the call should go to the assigned coordinator
4. **Check task attributes** in the TaskRouter console to confirm routing type

## Monitoring and Analytics

### Key Metrics to Track

- **Project Coordinator Routing Success Rate**: % of calls successfully routed to coordinators
- **Coordinator Availability**: % of time coordinators are available to receive calls
- **Fallback Rate**: % of calls that fall back to department routing
- **Customer Satisfaction**: Ratings for calls routed to coordinators vs. general queue

### Logging

The system logs coordinator routing attempts:

```typescript
console.log('Project coordinator routing:', {
  customerId: quickbaseResult.customerId,
  coordinatorId: quickbaseResult.projectCoordinator,
  workerSid: coordinatorWorker.twilioWorkerSid,
  available: coordinatorWorker.available
});
```

## Troubleshooting

### Calls Not Routing to Coordinator

**Check 1: QuickBase Lookup**
- Verify the customer's phone number in QuickBase
- Ensure project coordinator field is populated
- Check QuickBase API credentials

**Check 2: User Mapping**
- Confirm user exists with matching `quickbaseUserId`
- Verify user has an associated Worker record

**Check 3: Worker Availability**
- Check coordinator's current activity status
- Ensure activity is set to "Available" (available: true)

**Check 4: Workflow Configuration**
- Verify workflow filter checks `preferred_worker_sid`
- Ensure filter priority is correct (coordinator route should be first)

### High Fallback Rate

If many calls are falling back to department routing:

1. **Check coordinator availability patterns** - Are they frequently offline?
2. **Review timeout settings** - 30 seconds may be too short
3. **Verify QuickBase data quality** - Are all customers assigned coordinators?
4. **Monitor activity transitions** - Are coordinators changing status frequently?

## Best Practices

### 1. Coordinator Availability Management

- Set realistic expectations for coordinator availability
- Use "Available" status only when actively ready to take calls
- Transition to "Busy" during calls or "Wrap-up" after calls

### 2. Fallback Handling

- Configure meaningful fallback routes (department > general support)
- Set appropriate timeouts (recommended: 30 seconds)
- Monitor fallback rate and adjust strategies

### 3. Data Quality

- Keep QuickBase project coordinator assignments up to date
- Regularly sync QuickBase users with system users
- Validate `quickbaseUserId` mapping during user creation

### 4. Performance

- QuickBase lookups have a 5-second timeout to prevent blocking
- Failed lookups log warnings but don't block call processing
- Consider caching frequently-called customer data

## API Reference

### `RoutingEngine.findWorkerByProjectCoordinator()`

Finds a TaskRouter worker by their QuickBase coordinator ID.

**Parameters:**
- `coordinatorId: string` - QuickBase project coordinator ID

**Returns:**
```typescript
{
  twilioWorkerSid: string;  // Twilio worker SID
  available: boolean;       // Is worker currently available
} | null
```

**Example:**
```typescript
const worker = await RoutingEngine.findWorkerByProjectCoordinator("qb_user_456");
if (worker && worker.available) {
  // Route to this worker
}
```

### Task Attribute: `preferred_worker_sid`

Set by routing engine when a project coordinator is found and available.

**Type:** `string | undefined`

**Usage in Workflow:**
```json
{
  "expression": "preferred_worker_sid != null AND worker.sid == task.preferred_worker_sid"
}
```

### Task Attribute: `routing_type`

Indicates which routing method was used.

**Type:** `"project_coordinator" | "department" | "skills" | "default"`

**Values:**
- `"project_coordinator"` - Routed to assigned coordinator
- `"department"` - Routed by department
- `"skills"` - Routed by required skills
- `"default"` - Default routing (no special conditions)

## Related Documentation

- [TaskRouter Configuration](../taskrouter-configuration.md)
- [QuickBase Integration](./customer-lookup.md)
- [Routing Engine Documentation](../../src/lib/twilio/routing.ts)
- [Workflow Management](../sdks/taskrouter/README.md)