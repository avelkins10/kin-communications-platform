# TaskRouter Configuration Guide

This guide explains how to configure Twilio TaskRouter for the KIN Communications Platform.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Required Twilio TaskRouter Variables

```bash
# Twilio TaskRouter Configuration
TWILIO_WORKSPACE_SID="your-workspace-sid"
TWILIO_WORKFLOW_SID="your-workflow-sid"
TWILIO_TASKQUEUE_SID_DEFAULT="your-default-taskqueue-sid"
TWILIO_TASKQUEUE_SID_GENERAL_SUPPORT="your-general-support-taskqueue-sid"
TWILIO_TASKQUEUE_SID_VOICEMAIL="your-voicemail-taskqueue-sid"
TWILIO_TASKQUEUE_SID_CANCELED="your-canceled-taskqueue-sid"
TWILIO_ACTIVITY_SID_AVAILABLE="your-available-activity-sid"
TWILIO_ACTIVITY_SID_OFFLINE="your-offline-activity-sid"
TWILIO_ACTIVITY_SID_BUSY="your-busy-activity-sid"
TWILIO_ACTIVITY_SID_WRAPUP="your-wrapup-activity-sid"

# TaskRouter Feature Flags
TWILIO_TASKROUTER_ENABLED="true"
```

### Existing Twilio Variables (Required)

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_API_KEY_SID="your-twilio-api-key-sid"
TWILIO_API_KEY_SECRET="your-twilio-api-key-secret"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WEBHOOK_BASE_URL="https://your-domain.com"
```

## TaskRouter Setup Steps

### 1. Create a TaskRouter Workspace

1. Log into your Twilio Console
2. Navigate to TaskRouter > Workspaces
3. Click "Create Workspace"
4. Name it "KIN Communications Workspace"
5. Copy the Workspace SID to `TWILIO_WORKSPACE_SID`

### 2. Create Activities

Create the following activities in your workspace:

- **Available** (Friendly Name: "Available", Available: true)
- **Offline** (Friendly Name: "Offline", Available: false)
- **Busy** (Friendly Name: "Busy", Available: false)
- **Wrap-up** (Friendly Name: "Wrap-up", Available: false)

Copy the Activity SIDs to the corresponding environment variables.

### 3. Create Task Queues

Create the following task queues:

- **Default Queue** (Friendly Name: "Default Queue")
- **General Support** (Friendly Name: "General Support")
- **Voicemail** (Friendly Name: "Voicemail Processing")
- **Canceled** (Friendly Name: "Canceled Tasks")

Copy the Task Queue SIDs to the corresponding environment variables.

### 4. Create Workflow

1. Navigate to TaskRouter > Workflows
2. Click "Create Workflow"
3. Name it "KIN Communications Workflow"
4. Configure the workflow to route tasks to your queues based on priority
5. Copy the Workflow SID to `TWILIO_WORKFLOW_SID`

### 5. Configure Webhooks

Set up the following webhook URLs in your Twilio Console:

- **TaskRouter Events**: `https://your-domain.com/api/webhooks/taskrouter`
- **Voice Events**: `https://your-domain.com/api/webhooks/twilio/voice`
- **SMS Events**: `https://your-domain.com/api/webhooks/twilio/sms`

## Database Migration

Run the following command to apply the TaskRouter database schema:

```bash
npm run prisma:migrate
```

## Testing the Integration

### 1. Create a Worker

1. Navigate to `/dashboard/taskrouter`
2. Go to the "Workers" tab
3. Click "Add Worker"
4. Fill in the worker details
5. The worker will be created in both Twilio and your local database

### 2. Test Task Creation

1. Make a test call to your Twilio phone number
2. The call should create a TaskRouter task
3. Check the "Tasks" tab to see the created task

### 3. Test Worker Interface

1. Go to the "My Interface" tab
2. Accept or reject incoming tasks
3. Update your activity status

## Routing Rules Configuration

### 1. Create Routing Rules

1. Navigate to the "Routing Rules" tab
2. Click "Add Rule"
3. Configure conditions and actions
4. Test the rule with sample data

### 2. Keyword Detection

1. Go to the "Keywords" tab
2. Add keyword detection rules
3. Test with sample text

## Troubleshooting

### Common Issues

1. **Worker not connecting**: Check that the worker token is being generated correctly
2. **Tasks not being created**: Verify webhook URLs are configured correctly
3. **Routing not working**: Check that routing rules are enabled and conditions are correct

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV="development"
```

### Webhook Testing

Use Twilio's webhook testing tools or ngrok to test webhooks locally:

```bash
ngrok http 3000
```

Then update your webhook URLs to use the ngrok URL.

## Security Considerations

1. **API Keys**: Store Twilio API keys securely and rotate them regularly
2. **Webhook Security**: The platform includes webhook signature verification
3. **Worker Tokens**: Tokens are generated per worker and expire after 1 hour
4. **Database Access**: Ensure your database is properly secured

## Performance Optimization

1. **Task Timeouts**: Set appropriate timeouts for different task types
2. **Worker Capacity**: Monitor worker capacity and adjust as needed
3. **Queue Priorities**: Use task priorities to ensure urgent tasks are handled first
4. **Caching**: The platform caches worker and task data for better performance

## Monitoring

Monitor the following metrics:

1. **Task Creation Rate**: Number of tasks created per hour
2. **Task Completion Rate**: Percentage of tasks completed successfully
3. **Worker Utilization**: Percentage of workers available vs. total
4. **Average Wait Time**: Time tasks wait before being assigned
5. **Routing Accuracy**: Percentage of tasks routed to correct departments

## Support

For issues with TaskRouter integration:

1. Check the application logs
2. Verify Twilio Console for TaskRouter events
3. Test webhook endpoints manually
4. Review routing rule configurations
