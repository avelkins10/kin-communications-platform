import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { webhookHandler } from "@/lib/api/webhook-handler";
import {
  TaskRouterWebhookBase,
  WorkerWebhook,
  TaskWebhook,
  ReservationWebhook,
} from "@/types/twilio";
import { 
  broadcastWorkerStatusChanged,
  broadcastWorkerActivityChanged,
  broadcastTaskAssigned,
  broadcastTaskAccepted,
  broadcastTaskRejected,
  broadcastTaskCompleted
} from "@/lib/socket/events";

async function handleTaskRouterWebhook(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Parse webhook data
    const webhookData: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      webhookData[key] = value;
    }

    const eventType = webhookData.EventType;
    const resourceType = webhookData.ResourceType;

    console.log(`TaskRouter webhook received: ${eventType} for ${resourceType}`);

    // Handle different event types
    switch (resourceType) {
      case "worker":
        await handleWorkerEvent(webhookData as unknown as WorkerWebhook);
        break;
      case "task":
        await handleTaskEvent(webhookData as unknown as TaskWebhook);
        break;
      case "reservation":
        await handleReservationEvent(webhookData as unknown as ReservationWebhook);
        break;
      default:
        console.log(`Unhandled TaskRouter event type: ${resourceType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling TaskRouter webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handleWorkerEvent(webhook: WorkerWebhook) {
  try {
    const worker = await db.worker.findUnique({
      where: { twilioWorkerSid: webhook.WorkerSid },
    });

    if (!worker) {
      console.log(`Worker not found in database: ${webhook.WorkerSid}`);
      return;
    }

    switch (webhook.EventType) {
      case "worker.updated":
      case "worker.activity.update":
        try {
          // Get the activity to determine availability
          const activity = await db.activity.findUnique({
            where: { twilioActivitySid: webhook.WorkerActivitySid },
          });

          const updatedWorker = await db.worker.update({
            where: { id: worker.id },
            data: {
              activitySid: webhook.WorkerActivitySid,
              attributes: JSON.parse(webhook.WorkerAttributes),
              available: activity?.available ?? false,
            },
            include: {
              User: true,
              activity: true
            }
          });

          // Broadcast worker status changed event
          broadcastWorkerStatusChanged({
            id: updatedWorker.id,
            workerSid: updatedWorker.twilioWorkerSid,
            friendlyName: updatedWorker.User?.name || 'Unknown Worker',
            activityName: updatedWorker.activity?.friendlyName || 'Unknown',
            activitySid: updatedWorker.activitySid || '',
            available: updatedWorker.available,
            attributes: updatedWorker.attributes as any,
            department: updatedWorker.User?.department || undefined,
            lastActivityAt: updatedWorker.updatedAt.toISOString(),
            createdAt: updatedWorker.createdAt.toISOString(),
            updatedAt: updatedWorker.updatedAt.toISOString()
          });

          // Broadcast worker activity changed event
          broadcastWorkerActivityChanged({
            id: updatedWorker.id,
            workerSid: updatedWorker.twilioWorkerSid,
            friendlyName: updatedWorker.User?.name || 'Unknown Worker',
            activityName: updatedWorker.activity?.friendlyName || 'Unknown',
            activitySid: updatedWorker.activitySid || '',
            available: updatedWorker.available,
            attributes: updatedWorker.attributes as any,
            department: updatedWorker.User?.department || undefined,
            lastActivityAt: updatedWorker.updatedAt.toISOString(),
            createdAt: updatedWorker.createdAt.toISOString(),
            updatedAt: updatedWorker.updatedAt.toISOString()
          });
        } catch (error) {
          console.error(`Error handling worker event ${webhook.EventType}:`, error);
        }
        break;
      case "worker.deleted":
        await db.worker.delete({
          where: { id: worker.id },
        });
        break;
    }

    console.log(`Worker event processed: ${webhook.EventType} for ${webhook.WorkerSid}`);
  } catch (error) {
    console.error("Error handling worker event:", error);
  }
}

async function handleTaskEvent(webhook: TaskWebhook) {
  try {
    const task = await db.task.findUnique({
      where: { twilioTaskSid: webhook.TaskSid },
    });

    if (!task) {
      console.log(`Task not found in database: ${webhook.TaskSid}`);
      return;
    }

    const taskAttributes = JSON.parse(webhook.TaskAttributes);

    switch (webhook.EventType) {
      case "task.updated":
        try {
          const updatedTask = await db.task.update({
            where: { id: task.id },
            data: {
              taskQueueSid: webhook.TaskQueueSid,
              attributes: taskAttributes,
              priority: parseInt(webhook.TaskPriority),
              assignmentStatus: webhook.TaskAssignmentStatus.toUpperCase() as any,
            },
            include: {
              Worker: {
                include: {
                  User: true
                }
              }
            }
          });

          // Broadcast task assigned event if status changed to assigned
          if (webhook.TaskAssignmentStatus === 'assigned') {
            broadcastTaskAssigned({
              id: updatedTask.id,
              taskSid: updatedTask.twilioTaskSid,
              taskQueueSid: updatedTask.taskQueueSid || '',
              taskQueueName: 'Unknown Queue', // TODO: Get queue name
              workerSid: updatedTask.Worker?.twilioWorkerSid || undefined,
              workerName: updatedTask.Worker?.User?.name || undefined,
              attributes: updatedTask.attributes as any,
              priority: updatedTask.priority,
              status: 'assigned',
              assignmentStatus: 'assigned',
              timeout: 300, // Default timeout
              createdAt: updatedTask.createdAt.toISOString(),
              updatedAt: updatedTask.updatedAt.toISOString()
            });
          }
        } catch (error) {
          console.error(`Error handling task event ${webhook.EventType}:`, error);
        }
        break;
      case "task.canceled":
        await db.task.update({
          where: { id: task.id },
          data: {
            assignmentStatus: "CANCELED",
          },
        });
        break;
      case "task.completed":
        const completedTask = await db.task.update({
          where: { id: task.id },
          data: {
            assignmentStatus: "COMPLETED",
          },
          include: {
            Worker: {
              include: {
                User: true
              }
            }
          }
        });

        // Broadcast task completed event
        broadcastTaskCompleted({
          id: completedTask.id,
          taskSid: completedTask.twilioTaskSid,
          taskQueueSid: completedTask.taskQueueSid || '',
          taskQueueName: 'Unknown Queue', // TODO: Get queue name
          workerSid: completedTask.Worker?.twilioWorkerSid || undefined,
          workerName: completedTask.Worker?.User?.name || undefined,
          attributes: completedTask.attributes as any,
          priority: completedTask.priority,
          status: 'completed',
          assignmentStatus: 'accepted',
          timeout: 300, // Default timeout
          createdAt: completedTask.createdAt.toISOString(),
          updatedAt: completedTask.updatedAt.toISOString()
        });
        break;
      case "task.wrapup":
        const wrapupTask = await db.task.update({
          where: { id: task.id },
          data: {
            assignmentStatus: "COMPLETED",
          },
          include: {
            Worker: {
              include: {
                User: true
              }
            }
          }
        });

        // Broadcast task completed event
        broadcastTaskCompleted({
          id: wrapupTask.id,
          taskSid: wrapupTask.twilioTaskSid,
          taskQueueSid: wrapupTask.taskQueueSid || '',
          taskQueueName: 'Unknown Queue', // TODO: Get queue name
          workerSid: wrapupTask.Worker?.twilioWorkerSid || undefined,
          workerName: wrapupTask.Worker?.User?.name || undefined,
          attributes: wrapupTask.attributes as any,
          priority: wrapupTask.priority,
          status: 'completed',
          assignmentStatus: 'accepted',
          timeout: 300, // Default timeout
          createdAt: wrapupTask.createdAt.toISOString(),
          updatedAt: wrapupTask.updatedAt.toISOString()
        });
        break;
    }

    console.log(`Task event processed: ${webhook.EventType} for ${webhook.TaskSid}`);
  } catch (error) {
    console.error("Error handling task event:", error);
  }
}

async function handleReservationEvent(webhook: ReservationWebhook) {
  try {
    const reservation = await db.reservation.findUnique({
      where: { twilioReservationSid: webhook.TaskChannelReservationSid },
    });

    if (!reservation) {
      console.log(`Reservation not found in database: ${webhook.TaskChannelReservationSid}`);
      return;
    }

    switch (webhook.EventType) {
      case "reservation.accepted":
        try {
          const acceptedReservation = await db.reservation.update({
            where: { id: reservation.id },
            data: {
              status: "ACCEPTED",
              acceptedAt: new Date(),
            },
            include: {
              Task: {
                include: {
                  Worker: {
                    include: {
                      User: true
                    }
                  }
                }
              }
            }
          });
          
          // Update task assignment
          await db.task.update({
            where: { id: reservation.taskId },
            data: {
              assignmentStatus: "ACCEPTED",
              workerId: reservation.workerId,
            },
          });

          // Broadcast task accepted event
          broadcastTaskAccepted({
            id: acceptedReservation.Task?.id || '',
            taskSid: acceptedReservation.Task?.twilioTaskSid || '',
            taskQueueSid: acceptedReservation.Task?.taskQueueSid || '',
            taskQueueName: 'Unknown Queue', // TODO: Get queue name
            workerSid: acceptedReservation.Task?.Worker?.twilioWorkerSid || undefined,
            workerName: acceptedReservation.Task?.Worker?.User?.name || undefined,
            attributes: acceptedReservation.Task?.attributes as any,
            priority: acceptedReservation.Task?.priority || 0,
            status: 'accepted',
            assignmentStatus: 'accepted',
            timeout: 300, // Default timeout
            createdAt: acceptedReservation.Task?.createdAt.toISOString() || new Date().toISOString(),
            updatedAt: acceptedReservation.Task?.updatedAt.toISOString() || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error handling reservation event ${webhook.EventType}:`, error);
        }
        break;
      case "reservation.rejected":
        const rejectedReservation = await db.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "REJECTED",
            rejectedAt: new Date(),
          },
          include: {
            Task: {
              include: {
                Worker: {
                include: {
                  User: true
                }
                }
              }
            }
          }
        });

        // Broadcast task rejected event
        broadcastTaskRejected({
          id: rejectedReservation.Task?.id || '',
          taskSid: rejectedReservation.Task?.twilioTaskSid || '',
          taskQueueSid: rejectedReservation.Task?.taskQueueSid || '',
          taskQueueName: 'Unknown Queue', // TODO: Get queue name
          workerSid: rejectedReservation.Task?.Worker?.twilioWorkerSid || undefined,
          workerName: rejectedReservation.Task?.Worker?.User?.name || undefined,
          attributes: rejectedReservation.Task?.attributes as any,
          priority: rejectedReservation.Task?.priority || 0,
          status: 'rejected',
          assignmentStatus: 'rejected',
          timeout: 300, // Default timeout
          createdAt: rejectedReservation.Task?.createdAt.toISOString() || new Date().toISOString(),
          updatedAt: rejectedReservation.Task?.updatedAt.toISOString() || new Date().toISOString()
        });
        break;
      case "reservation.timeout":
        await db.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "TIMEOUT",
          },
        });
        break;
      case "reservation.canceled":
        await db.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "CANCELED",
          },
        });
        break;
      case "reservation.completed":
        await db.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "ACCEPTED",
          },
        });
        
        // Update task status
        await db.task.update({
          where: { id: reservation.taskId },
          data: {
            assignmentStatus: "COMPLETED",
          },
        });
        break;
    }

    console.log(`Reservation event processed: ${webhook.EventType} for ${webhook.TaskChannelReservationSid}`);
  } catch (error) {
    console.error("Error handling reservation event:", error);
  }
}

export async function POST(request: NextRequest) {
  return await webhookHandler(request, async (params: FormData) => {
    await handleTaskRouterWebhook(request);
    return { success: true };
  });
}
