import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { 
  contactConfigurationSchema, 
  contactConfigurationUpdateSchema 
} from "@/lib/validations/contact";
import { revalidateTag } from "next/cache";

// Mock configuration data for development
const mockConfiguration = {
  id: 'config-1',
  name: 'Default Configuration',
  description: 'Default contact management configuration',
  stalenessRules: {
    activeTimeoutMonths: 6,
    holdTimeoutMonths: 3,
    enabled: true
  },
  statusMappings: {
    activeStatuses: ['active', 'in_progress', 'pending', 'new'],
    inactiveStatuses: ['completed', 'cancelled', 'hold', 'inactive']
  },
  slaSettings: {
    voicemailCallback: {
      sameDayBefore3PM: true,
      nextBusinessDayAfter: true,
      enabled: true
    },
    textResponse: {
      businessHoursMinutes: 30,
      afterHoursNextDay9AM: true,
      enabled: true
    },
    missedCallFollowup: {
      hours: 1,
      enabled: true
    }
  },
  capabilities: {
    slaTracking: true, // Enable/disable SLA tracking features
    slaEndpoints: true, // Enable/disable SLA API endpoints
    realTimeUpdates: false // Enable/disable real-time SLA updates
  },
  isActive: true,
  createdBy: 'user-1',
  createdByUser: {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@kin.com'
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow read-only access for all authenticated users
    // Only managers and admins can modify configurations

    // In a real implementation, you would fetch from database:
    // const configurations = await prisma.contactConfiguration.findMany({
    //   where: { isActive: true },
    //   include: { createdByUser: true },
    //   orderBy: { createdAt: 'desc' }
    // });

    // For now, return mock data
    return NextResponse.json({
      configurations: [mockConfiguration],
      current: mockConfiguration
    });
  } catch (error) {
    console.error('Error fetching contact configurations:', error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has manager/admin permissions
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = contactConfigurationSchema.parse(body);
    
    // In a real implementation, you would:
    // 1. Save to database using Prisma
    // 2. Deactivate previous configurations
    // 3. Trigger staleness recalculation for all contacts
    // 4. Send real-time updates via Socket.io

    const newConfiguration = {
      id: `config-${Date.now()}`,
      ...validatedData,
      createdBy: session.user.id,
      createdByUser: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock response
    return NextResponse.json(newConfiguration, { status: 201 });
  } catch (error) {
    console.error('Error creating contact configuration:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid configuration data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has manager/admin permissions
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let configId = searchParams.get("id");
    const body = await request.json();
    if (!configId && body?.id) {
      configId = String(body.id);
    }
    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }
    
    // Validate the request body
    const validatedData = contactConfigurationUpdateSchema.parse(body);
    
    // In a real implementation, you would:
    // 1. Update the configuration in database
    // 2. If staleness rules changed, trigger recalculation
    // 3. If SLA settings changed, update all contact SLA due dates
    // 4. Send real-time updates via Socket.io

    const updatedConfiguration = {
      id: configId,
      ...mockConfiguration,
      ...validatedData,
      updatedAt: new Date()
    };

    // Invalidate cache
    revalidateTag('contact-configurations');

    return NextResponse.json(updatedConfiguration);
  } catch (error) {
    console.error('Error updating contact configuration:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid configuration data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions (only admins can delete)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("id");
    
    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Check if this is the only active configuration
    // 2. Soft delete or hard delete from database
    // 3. Invalidate cache

    // Invalidate cache
    revalidateTag('contact-configurations');

    return NextResponse.json({ success: true, message: "Configuration deleted successfully" });
  } catch (error) {
    console.error('Error deleting contact configuration:', error);
    return NextResponse.json(
      { error: "Failed to delete configuration" },
      { status: 500 }
    );
  }
}


