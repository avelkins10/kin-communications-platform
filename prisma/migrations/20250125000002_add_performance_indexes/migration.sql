-- Add performance indexes for better query performance
-- This migration adds comprehensive indexes to optimize common query patterns

-- User model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_updatedAt_idx" ON "User"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_twilioWorkerSid_idx" ON "User"("twilioWorkerSid");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_department_idx" ON "User"("department");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_role_department_idx" ON "User"("role", "department");

-- Contact model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_ownerId_idx" ON "Contact"("ownerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_createdAt_idx" ON "Contact"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_updatedAt_idx" ON "Contact"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_firstName_lastName_idx" ON "Contact"("firstName", "lastName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_organization_idx" ON "Contact"("organization");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Contact_tags_idx" ON "Contact" USING GIN("tags");

-- Call model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_direction_idx" ON "Call"("direction");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_status_idx" ON "Call"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_startedAt_idx" ON "Call"("startedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_endedAt_idx" ON "Call"("endedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_createdAt_idx" ON "Call"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_userId_status_idx" ON "Call"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_contactId_status_idx" ON "Call"("contactId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Call_fromNumber_toNumber_idx" ON "Call"("fromNumber", "toNumber");

-- Message model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_direction_idx" ON "Message"("direction");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_sentAt_idx" ON "Message"("sentAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_readAt_idx" ON "Message"("readAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_templateId_idx" ON "Message"("templateId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_userId_status_idx" ON "Message"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_contactId_status_idx" ON "Message"("contactId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_fromNumber_toNumber_idx" ON "Message"("fromNumber", "toNumber");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_status_createdAt_idx" ON "Message"("status", "createdAt");

-- MessageTemplate model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MessageTemplate_createdAt_idx" ON "MessageTemplate"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MessageTemplate_updatedAt_idx" ON "MessageTemplate"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MessageTemplate_usageCount_idx" ON "MessageTemplate"("usageCount");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MessageTemplate_userId_category_idx" ON "MessageTemplate"("userId", "category");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MessageTemplate_isShared_category_idx" ON "MessageTemplate"("isShared", "category");

-- Voicemail model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_updatedAt_idx" ON "Voicemail"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_readAt_idx" ON "Voicemail"("readAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_assignedToId_priority_idx" ON "Voicemail"("assignedToId", "priority");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_assignedToId_readAt_idx" ON "Voicemail"("assignedToId", "readAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_priority_createdAt_idx" ON "Voicemail"("priority", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Voicemail_emailSent_createdAt_idx" ON "Voicemail"("emailSent", "createdAt");

-- RoutingRule model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RoutingRule_createdAt_idx" ON "RoutingRule"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RoutingRule_updatedAt_idx" ON "RoutingRule"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RoutingRule_enabled_priority_idx" ON "RoutingRule"("enabled", "priority");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RoutingRule_workflowSid_enabled_idx" ON "RoutingRule"("workflowSid", "enabled");

-- PhoneNumber model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PhoneNumber_createdAt_idx" ON "PhoneNumber"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PhoneNumber_updatedAt_idx" ON "PhoneNumber"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PhoneNumber_userId_status_idx" ON "PhoneNumber"("userId", "status");

-- Worker model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Worker_createdAt_idx" ON "Worker"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Worker_updatedAt_idx" ON "Worker"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Worker_available_activitySid_idx" ON "Worker"("available", "activitySid");

-- Task model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_updatedAt_idx" ON "Task"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_callId_idx" ON "Task"("callId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_messageId_idx" ON "Task"("messageId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_assignmentStatus_priority_idx" ON "Task"("assignmentStatus", "priority");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_workerId_assignmentStatus_idx" ON "Task"("workerId", "assignmentStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_taskQueueSid_assignmentStatus_idx" ON "Task"("taskQueueSid", "assignmentStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_workflowSid_assignmentStatus_idx" ON "Task"("workflowSid", "assignmentStatus");

-- Activity model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Activity_updatedAt_idx" ON "Activity"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Activity_available_friendlyName_idx" ON "Activity"("available", "friendlyName");

-- TaskQueue model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TaskQueue_createdAt_idx" ON "TaskQueue"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TaskQueue_updatedAt_idx" ON "TaskQueue"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TaskQueue_taskOrder_idx" ON "TaskQueue"("taskOrder");

-- Workflow model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Workflow_createdAt_idx" ON "Workflow"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Workflow_updatedAt_idx" ON "Workflow"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Workflow_taskTimeout_idx" ON "Workflow"("taskTimeout");

-- Reservation model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_createdAt_idx" ON "Reservation"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_updatedAt_idx" ON "Reservation"("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_acceptedAt_idx" ON "Reservation"("acceptedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_rejectedAt_idx" ON "Reservation"("rejectedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_timeoutAt_idx" ON "Reservation"("timeoutAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_status_createdAt_idx" ON "Reservation"("status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_workerId_status_idx" ON "Reservation"("workerId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reservation_taskId_status_idx" ON "Reservation"("taskId", "status");

-- Session model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_sessionToken_idx" ON "Session"("sessionToken");

-- WebhookLog model indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");
