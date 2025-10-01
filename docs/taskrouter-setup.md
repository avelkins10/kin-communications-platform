# TaskRouter Setup Guide

This guide explains how to set up and configure TaskRouter for the KIN Communications Platform.

## Prerequisites

### Twilio Account Setup

1. **Enable TaskRouter**: Ensure TaskRouter is enabled in your Twilio account
2. **Create Workspace**: Create a TaskRouter workspace in the Twilio console
3. **Note Workspace SID**: You'll need this for environment variables

### Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# TaskRouter Configuration
TWILIO_WORKSPACE_SID=your_workspace_sid
TWILIO_WORKFLOW_SID=your_workflow_sid
TWILIO_DEFAULT_TASK_QUEUE_SID=your_default_queue_sid

# Department-specific Task Queues
TWILIO_PERMITS_TASK_QUEUE_SID=your_permits_queue_sid
TWILIO_UTILITIES_TASK_QUEUE_SID=your_utilities_queue_sid
TWILIO_SCHEDULING_TASK_QUEUE_SID=your_scheduling_queue_sid
TWILIO_EMERGENCY_TASK_QUEUE_SID=your_emergency_queue_sid
TWILIO_BILLING_TASK_QUEUE_SID=your_billing_queue_sid
TWILIO_SUPPORT_TASK_QUEUE_SID=your_support_queue_sid
```

## Initial Setup

### 1. Create Default Activities

In the Twilio console, create these default activities:

- **Available** (available: true) - Workers can receive tasks
- **Unavailable** (available: false) - Workers are busy
- **Offline** (available: false) - Workers are not available
- **Break** (available: false) - Workers are on break

### 2. Create Task Queues

Create task queues for each department:

- **Default Queue** - General tasks
- **Permits Queue** - Permit-related tasks
- **Utilities Queue** - Utility-related tasks
- **Scheduling Queue** - Scheduling tasks
- **Emergency Queue** - Emergency tasks
- **Billing Queue** - Billing tasks
- **Support Queue** - Support tasks

Each queue should have:
- `targetWorkers`: `"1==1"` (all workers)
- `maxReservedWorkers`: `1`
- `taskOrder`: `"FIFO"`

### 3. Create Default Workflow

Create a workflow with this configuration:

```json
{
  "task_routing": {
    "filters": [
      {
        "expression": "task.department == 'permits'",
        "targets": [
          {
            "queue": "your_permits_queue_sid",
            "priority": 50
          }
        ]
      },
      {
        "expression": "task.department == 'utilities'",
        "targets": [
          {
            "queue": "your_utilities_queue_sid",
            "priority": 50
          }
        ]
      },
      {
        "expression": "task.department == 'emergency'",
        "targets": [
          {
            "queue": "your_emergency_queue_sid",
            "priority": 100
          }
        ]
      }
    ],
    "default_filter": {
      "queue": "your_default_queue_sid"
    }
  }
}
```

### 4. Configure Webhooks

Set up webhooks in the Twilio console:

- **Worker Events**: `https://your-domain.com/api/webhooks/taskrouter`
- **Task Events**: `https://your-domain.com/api/webhooks/taskrouter`
- **Reservation Events**: `https://your-domain.com/api/webhooks/taskrouter`

## Syncing Resources

### Initial Sync

Run the sync script to populate your local database with Twilio resources:

```bash
# Sync all resources
pnpm sync:taskrouter --all

# Or sync specific resources
pnpm sync:taskrouter --activities --queues --workflows --workers
```

### What the Sync Script Does

1. **Activities**: Fetches all activities from Twilio and upserts them into the database
2. **Task Queues**: Fetches all task queues and upserts them
3. **Workflows**: Fetches all workflows and upserts them
4. **Workers**: Fetches all workers and attempts to link them to users by email or QuickBase ID

## Creating Workers

### Via Admin UI

1. Navigate to the TaskRouter section in the admin UI
2. Click "Create Worker"
3. Select a user and configure worker attributes
4. Assign an activity (Available, Unavailable, etc.)

### Via API

```bash
curl -X POST https://your-domain.com/api/taskrouter/workers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "friendlyName": "John Doe",
    "attributes": {
      "skills": ["permits", "utilities"],
      "department": "permits"
    },
    "activitySid": "your_available_activity_sid"
  }'
```

### Via Sync Script

The sync script will automatically link existing Twilio workers to users if:
- The worker's attributes contain an `email` field matching a user's email
- The worker's attributes contain a `quickbaseUserId` field matching a user's QuickBase ID

## Configuring Routing Rules

### Creating Routing Rules

Use the admin UI to create routing rules:

1. Navigate to TaskRouter → Routing Rules
2. Click "Create Rule"
3. Define conditions (keywords, time, customer data)
4. Set actions (route to queue, set priority, add attributes)

### Example Routing Rules

**Emergency Keywords**:
- Condition: `task.attributes.keywords contains "emergency"`
- Action: Route to Emergency queue, priority 100

**VIP Customers**:
- Condition: `task.attributes.customer_type == "vip"`
- Action: Route to Support queue, priority 75

**After Hours**:
- Condition: `time.hour < 8 OR time.hour > 18`
- Action: Route to Voicemail queue

## Testing the Integration

### 1. Make a Test Call

1. Call your Twilio number
2. The voice webhook will create a call record
3. The routing engine will determine the appropriate queue
4. A TaskRouter task will be created
5. The call will be enqueued

### 2. Verify Task Creation

Check the database for the created task:

```sql
SELECT * FROM "Task" WHERE "callId" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1;
```

### 3. Check Worker Assignment

1. Log into the admin UI
2. Navigate to TaskRouter → Workers
3. Verify workers are available and assigned to the correct activity
4. Check that tasks appear in the appropriate queues

### 4. Test Task Assignment

1. Create a test task via the API
2. Verify it appears in the correct queue
3. Check that available workers can see the task
4. Test accepting/rejecting tasks

## Troubleshooting

### Common Issues

**"Worker not found" errors**:
- Ensure workers are synced: `pnpm sync:taskrouter --workers`
- Check that users have corresponding worker records

**"Queue not found" errors**:
- Ensure queues are synced: `pnpm sync:taskrouter --queues`
- Verify environment variables are set correctly

**"Task creation failed" errors**:
- Check Twilio logs for API errors
- Verify workspace SID and workflow SID are correct
- Ensure webhook URLs are accessible

**Webhook not firing**:
- Verify webhook URLs are configured in Twilio console
- Check that your server is accessible from the internet
- Review webhook logs for signature validation errors

### Debugging Steps

1. **Check Environment Variables**:
   ```bash
   echo $TWILIO_WORKSPACE_SID
   echo $TWILIO_WORKFLOW_SID
   ```

2. **Test Twilio Connection**:
   ```bash
   # Run the sync script to test connectivity
   pnpm sync:taskrouter --activities
   ```

3. **Check Database Relations**:
   ```sql
   -- Verify worker-activity relations
   SELECT w."friendlyName", a."friendlyName" 
   FROM "Worker" w 
   LEFT JOIN "Activity" a ON w."activitySid" = a."twilioActivitySid";
   ```

4. **Review Logs**:
   - Check application logs for TaskRouter service errors
   - Review Twilio webhook logs in the console
   - Monitor database queries for relation issues

### Performance Optimization

1. **Database Indexes**: Ensure proper indexes on TaskRouter tables
2. **Webhook Processing**: Use background jobs for heavy webhook processing
3. **Caching**: Cache frequently accessed activities and queues
4. **Rate Limiting**: Implement rate limiting for Twilio API calls

## Security Considerations

1. **Webhook Signatures**: Always validate Twilio webhook signatures
2. **API Authentication**: Secure TaskRouter API endpoints with proper authentication
3. **Environment Variables**: Never commit Twilio credentials to version control
4. **Access Control**: Implement proper role-based access for TaskRouter management

## Monitoring and Maintenance

### Regular Tasks

1. **Sync Resources**: Run sync script weekly to keep data in sync
2. **Monitor Queues**: Check queue lengths and worker availability
3. **Review Logs**: Monitor for errors and performance issues
4. **Update Workflows**: Adjust routing rules based on business needs

### Metrics to Monitor

- Task creation rate
- Worker availability
- Queue wait times
- Task completion rates
- Webhook processing times

## References

- [Twilio TaskRouter Documentation](https://www.twilio.com/docs/taskrouter)
- [Internal TaskRouter Docs](./twilio-taskrouter.md)
- [SDK Documentation](./sdks/taskrouter/README.md)
- [API Reference](./api/taskrouter.md)

