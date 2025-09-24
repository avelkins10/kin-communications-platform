# Twilio TaskRouter API

## Core Endpoints

### Workspaces
- **POST** `/2010-04-01/Workspaces.json` - Create workspace
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}.json` - Get workspace
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}.json` - Update workspace

### Workers
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Workers.json` - Create worker
  - Body: `FriendlyName`, `Attributes` (JSON string with skills)
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}/Workers.json` - List workers
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Workers/{WorkerSid}.json` - Update worker

### Activities
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}/Activities.json` - List activities
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Activities.json` - Create activity

### Task Queues
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/TaskQueues.json` - Create queue
  - Body: `FriendlyName`, `TargetWorkers` (expression)
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}/TaskQueues.json` - List queues

### Workflows
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Workflows.json` - Create workflow
  - Body: `FriendlyName`, `Configuration` (JSON with routing rules)
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}/Workflows.json` - List workflows

### Tasks
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Tasks.json` - Create task
  - Body: `Attributes` (JSON with task data)
- **GET** `/2010-04-01/Workspaces/{WorkspaceSid}/Tasks.json` - List tasks

### Reservations
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Tasks/{TaskSid}/Reservations.json` - Create reservation
- **POST** `/2010-04-01/Workspaces/{WorkspaceSid}/Workers/{WorkerSid}/Reservations/{ReservationSid}.json` - Update reservation
  - Actions: `accept`, `reject`, `timeout`

## Worker Skills Example
```json
{
  "skills": ["sales", "support"],
  "languages": ["en", "es"],
  "level": 5
}
```

## Task Queue Target Expression
```
"skills HAS 'sales' AND languages HAS 'en'"
```

## Workflow Configuration
```json
{
  "task_routing": {
    "filters": [
      {
        "expression": "type=='sales'",
        "targets": [
          {
            "queue": "sales-queue",
            "priority": 10
          }
        ]
      }
    ],
    "default_filter": {
      "queue": "general-queue"
    }
  }
}
```
