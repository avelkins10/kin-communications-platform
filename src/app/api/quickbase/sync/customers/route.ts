import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quickbaseSyncSchema } from "@/lib/validations/contact";
import { revalidateTag } from "next/cache";
import { syncQuickBaseCustomerData } from "@/lib/quickbase/service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has appropriate permissions
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = quickbaseSyncSchema.parse(body);
    
    const { syncType, customerIds, forceUpdate } = validatedData;
    
    let syncResults = {
      success: 0,
      failed: 0,
      updated: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // Use the production QuickBase service
      const syncResult = await syncQuickBaseCustomerData({
        syncType,
        customerIds,
        forceUpdate
      });

      syncResults.success = syncResult.recordsCreated + syncResult.recordsUpdated;
      syncResults.failed = syncResult.errors.length;
      syncResults.updated = syncResult.recordsUpdated;
      syncResults.created = syncResult.recordsCreated;
      syncResults.errors = syncResult.errors;

      // Invalidate cache to ensure fresh data
      revalidateTag('contacts');
      revalidateTag('customers');

      return NextResponse.json({
        success: true,
        message: `Sync completed: ${syncResults.success} successful, ${syncResults.failed} failed`,
        results: syncResults
      });

    } catch (error) {
      console.error('QuickBase sync error:', error);
      return NextResponse.json(
        { error: "QuickBase sync failed", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in QuickBase sync endpoint:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid sync parameters", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process sync request" },
      { status: 500 }
    );
  }
}


// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has appropriate permissions
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get real sync status from database
    const totalCustomers = await prisma.contact.count({
      where: { type: 'CUSTOMER' }
    });

    const syncedCustomers = await prisma.contact.count({
      where: { 
        type: 'CUSTOMER',
        quickbaseId: { not: null }
      }
    });

    const pendingSync = totalCustomers - syncedCustomers;

    // Return sync status and statistics
    return NextResponse.json({
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // TODO: Store actual last sync time
      syncInProgress: false, // TODO: Implement sync status tracking
      totalCustomers,
      syncedCustomers,
      pendingSync,
      lastError: null // TODO: Store and return actual last error
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}


