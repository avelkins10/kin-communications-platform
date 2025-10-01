import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { routingRuleUpdateSchema } from "@/lib/validations/taskrouter";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can view routing rules
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    const rule = await db.routingRule.findUnique({
      where: { id: id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching routing rule:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch routing rule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update routing rules
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    const rule = await db.routingRule.findUnique({
      where: { id: id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = routingRuleUpdateSchema.parse(body);

    const updatedRule = await db.routingRule.update({
      where: { id: id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        priority: validatedData.priority,
        enabled: validatedData.enabled,
        conditions: validatedData.conditions,
        actions: validatedData.actions,
        workflowSid: validatedData.workflowSid,
        queueSid: validatedData.queueSid,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Error updating routing rule:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update routing rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete routing rules
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    const rule = await db.routingRule.findUnique({
      where: { id: id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
    }

    await db.routingRule.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting routing rule:", error);
    
    return NextResponse.json(
      { error: "Failed to delete routing rule" },
      { status: 500 }
    );
  }
}
