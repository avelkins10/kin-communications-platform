# TaskRouter JavaScript SDK

The TaskRouter JavaScript library provides a client-side interface for Twilio TaskRouter, enabling real-time task management and worker coordination.

## Installation

```bash
npm install twilio-taskrouter
```

## Dependencies

- `axios` - HTTP client
- `events` - Event emitter functionality
- `graphql-ws` - GraphQL WebSocket support
- `jwt-decode` - JWT token decoding
- `lodash` - Utility functions
- `loglevel` - Logging
- `path-browserify` - Path utilities for browser
- `typed-emitter` - TypeScript event emitter
- `ws` - WebSocket support

## Basic Usage

### Worker Setup

```javascript
const TaskRouter = require("twilio-taskrouter");
const Twilio = require("twilio");
const AccessToken = Twilio.jwt.AccessToken;
const TaskRouterGrant = AccessToken.TaskRouterGrant;

const accountSid = "your_account_sid";
const signingKeySid = "your_signing_key_sid";
const signingKeySecret = "your_signing_key_secret";
const workspaceSid = "your_workspace_sid";
const workerSid = "your_worker_sid";

const token = createAccessToken(
  accountSid,
  signingKeySid,
  signingKeySecret,
  workspaceSid,
  workerSid
);

const worker = new TaskRouter.Worker(token);

worker.on("ready", (readyWorker) => {
  console.log(`Worker ${readyWorker.sid} is now ready for work`);
});

worker.on("reservationCreated", (reservation) => {
  console.log(`Reservation ${reservation.sid} has been created for ${worker.sid}`);
  console.log(`Task attributes are: ${reservation.task.attributes}`);

  reservation.on("accepted", (acceptedReservation) => {
    console.log(`Reservation ${acceptedReservation.sid} was accepted.`);
  });

  reservation
    .accept()
    .then((acceptedReservation) => {
      console.log(`Reservation status is ${acceptedReservation.status}`);
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
});

function createAccessToken(
  accountSid,
  signingKeySid,
  signingKeySecret,
  workspaceSid,
  workerSid
) {
  const taskRouterGrant = new TaskRouterGrant({
    workerSid: workerSid,
    workspaceSid: workspaceSid,
    role: "worker",
  });

  const accessToken = new AccessToken(
    accountSid,
    signingKeySid,
    signingKeySecret
  );
  accessToken.addGrant(taskRouterGrant);
  accessToken.identity = "worker_identity";

  return accessToken.toJwt();
}
```

## Worker Class

### Properties

- `accountSid` - The sid of the Twilio account
- `activities` - Map of possible states a Worker can be in
- `activity` - The current Activity of the Worker
- `activitySid` - The sid of the Activity the Worker is currently in
- `activityName` - The current Activity name the Worker is currently in
- `attributes` - JSON representation of the Worker's attributes
- `available` - Whether or not the Worker is available to take on Tasks
- `channels` - Map of available Channels
- `connectActivitySid` - The Activity to set the Worker as on connect
- `dateCreated` - The date this Worker was created
- `dateStatusChanged` - The date this Worker's activity was last changed
- `dateUpdated` - The date this Worker was last updated
- `name` - The friendly name of the Worker
- `reservations` - Map of pending Reservations for the Worker
- `sid` - The sid of the Worker
- `workspaceSid` - The sid of the Workspace owning this Worker

### Events

- `activityUpdated` - Worker's activity has changed
- `attributesUpdated` - Worker's attributes have been updated
- `disconnected` - Worker has been disconnected
- `error` - An error occurred
- `ready` - Worker is ready for work
- `reservationCreated` - A new reservation has been created
- `reservationFailed` - A reservation has failed
- `tokenExpired` - Worker's token has expired
- `tokenUpdated` - Worker's token has been updated

## Task Class

### Properties

- `addOns` - The addons attached to the Task
- `age` - The age of the Task in seconds
- `attributes` - The attributes of the Task
- `dateCreated` - The date the Task was created
- `dateUpdated` - The date the Task was last updated
- `priority` - The priority of the Task
- `queueName` - The friendly name of the TaskQueue the Task is currently in
- `queueSid` - The sid of the TaskQueue the Task is currently in
- `reason` - The reason the Task was completed or canceled
- `routingTarget` - The target Sid of the Worker, TaskQueue, or Workflow
- `sid` - The sid of the Task
- `status` - The status of the Task (pending, reserved, assigned, canceled, completed, wrapping)
- `taskChannelSid` - The sid of the Task Channel associated to the Task in MultiTask mode
- `taskChannelUniqueName` - The unique name of the Task Channel
- `timeout` - The number of seconds the Task is allowed to live
- `transfers` - The IncomingTransfer and OutgoingTransfer related to this Task
- `workflowName` - The name of the Workflow responsible for routing the Task
- `workflowSid` - The sid of the Workflow responsible for routing the Task
- `version` - The version of this Task
- `reservationSid` - The sid of Reservation
- `virtualStartTime` - Optionally set starting time of the Task

### Events

- `canceled` - Task has been canceled
- `completed` - Task has been completed
- `transferAttemptFailed` - Transfer attempt has failed
- `transferCanceled` - Transfer has been canceled
- `transferCompleted` - Transfer has been completed
- `transferFailed` - Transfer has failed
- `transferInitiated` - Transfer has been initiated
- `updated` - Task has been updated
- `wrapup` - Task is in wrap-up state

## Reservation Class

### Properties

- `accountSid` - The sid of the Twilio account
- `dateCreated` - The date the Reservation was created
- `dateUpdated` - The date the Reservation was last updated
- `canceledReasonCode` - The reason code received when Reservation is canceled
- `sid` - The sid of the Reservation
- `status` - The current state of the Reservation (pending, accepted, rejected, timeout, canceled, rescinded, wrapping, completed)
- `task` - The Task tied to the Reservation
- `transfer` - The IncomingTransfer tied to the Reservation
- `timeout` - The number of seconds until the Task times out
- `workerSid` - The sid of the Worker
- `workspaceSid` - The sid of the Workspace owning this Reservation
- `version` - The version of this Reservation

### Events

- `accepted` - Reservation has been accepted
- `canceled` - Reservation has been canceled
- `completed` - Reservation has been completed
- `rejected` - Reservation has been rejected
- `rescinded` - Reservation has been rescinded
- `timeout` - Reservation has timed out
- `wrapup` - Reservation is in wrap-up state

## Key Methods

### Worker Methods

- `connect()` - Connect the worker to TaskRouter
- `disconnect()` - Disconnect the worker from TaskRouter
- `updateAttributes(attributes)` - Update worker attributes
- `updateActivity(activitySid)` - Update worker activity

### Reservation Methods

- `accept()` - Accept the reservation
- `reject()` - Reject the reservation
- `timeout()` - Timeout the reservation
- `complete()` - Complete the reservation
- `wrapup()` - Put reservation in wrap-up state

## Error Handling

The TaskRouter SDK uses EventEmitter for error handling:

```javascript
worker.on('error', (error) => {
  console.error('Worker error:', error);
});

reservation.on('error', (error) => {
  console.error('Reservation error:', error);
});
```

## Best Practices

1. **Token Management**: Always handle token expiration and renewal
2. **Error Handling**: Implement comprehensive error handling for all events
3. **Resource Cleanup**: Properly disconnect workers when done
4. **Activity Management**: Keep track of worker activities and availability
5. **Reservation Handling**: Always handle reservation timeouts and failures
