#!/usr/bin/env tsx

/**
 * Sync TaskRouter resources from Twilio to local database
 * 
 * Usage:
 *   pnpm sync:taskrouter --all
 *   pnpm sync:taskrouter --activities --queues
 *   pnpm sync:taskrouter --workflows --workers
 */

import { Command } from 'commander';
import { taskRouterService } from '../src/lib/twilio/taskrouter';
import { db } from '../src/lib/db';

const program = new Command();

program
  .name('sync-taskrouter')
  .description('Sync TaskRouter resources from Twilio to local database')
  .version('1.0.0');

program
  .option('--activities', 'Sync activities')
  .option('--queues', 'Sync task queues')
  .option('--workflows', 'Sync workflows')
  .option('--workers', 'Sync workers')
  .option('--all', 'Sync all resources')
  .parse();

const options = program.opts();

async function syncActivities() {
  try {
    console.log('🔄 Syncing activities...');
    const activities = await taskRouterService.getActivities();
    console.log(`✅ Synced ${activities.length} activities`);
    return activities.length;
  } catch (error) {
    console.error('❌ Error syncing activities:', error);
    return 0;
  }
}

async function syncTaskQueues() {
  try {
    console.log('🔄 Syncing task queues...');
    const queues = await taskRouterService.getTaskQueues();
    console.log(`✅ Synced ${queues.length} task queues`);
    return queues.length;
  } catch (error) {
    console.error('❌ Error syncing task queues:', error);
    return 0;
  }
}

async function syncWorkflows() {
  try {
    console.log('🔄 Syncing workflows...');
    const workflows = await taskRouterService.getWorkflows();
    console.log(`✅ Synced ${workflows.length} workflows`);
    return workflows.length;
  } catch (error) {
    console.error('❌ Error syncing workflows:', error);
    return 0;
  }
}

async function syncWorkers() {
  try {
    console.log('🔄 Syncing workers...');
    const workers = await taskRouterService.getWorkers();
    
    // For each worker, try to link to a user if possible
    let linkedCount = 0;
    for (const worker of workers) {
      if (!worker.userId) {
        // Try to find a user by email or QuickBase ID from worker attributes
        const attributes = worker.attributes as any;
        if (attributes?.email) {
          const user = await db.user.findUnique({
            where: { email: attributes.email }
          });
          if (user) {
            await db.worker.update({
              where: { id: worker.id },
              data: { userId: user.id }
            });
            linkedCount++;
          }
        } else if (attributes?.quickbaseUserId) {
          const user = await db.user.findUnique({
            where: { quickbaseUserId: attributes.quickbaseUserId }
          });
          if (user) {
            await db.worker.update({
              where: { id: worker.id },
              data: { userId: user.id }
            });
            linkedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Synced ${workers.length} workers (linked ${linkedCount} to users)`);
    return workers.length;
  } catch (error) {
    console.error('❌ Error syncing workers:', error);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting TaskRouter sync...');
  
  const startTime = Date.now();
  let totalSynced = 0;
  
  try {
    // Check if we should sync all resources
    if (options.all || (!options.activities && !options.queues && !options.workflows && !options.workers)) {
      console.log('📋 Syncing all resources...');
      totalSynced += await syncActivities();
      totalSynced += await syncTaskQueues();
      totalSynced += await syncWorkflows();
      totalSynced += await syncWorkers();
    } else {
      // Sync only specified resources
      if (options.activities) {
        totalSynced += await syncActivities();
      }
      if (options.queues) {
        totalSynced += await syncTaskQueues();
      }
      if (options.workflows) {
        totalSynced += await syncWorkflows();
      }
      if (options.workers) {
        totalSynced += await syncWorkers();
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n🎉 Sync completed! Synced ${totalSynced} resources in ${duration}ms`);
    
  } catch (error) {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

