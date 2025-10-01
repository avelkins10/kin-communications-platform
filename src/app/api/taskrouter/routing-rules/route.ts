import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { routingRuleSchema, routingRuleQuerySchema } from "@/lib/validations/taskrouter";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can view routing rules
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = routingRuleQuerySchema.parse(queryParams);
    
    const where: any = {};
    
    if (validatedQuery.enabled !== undefined) {
      where.enabled = validatedQuery.enabled === "true";
    }
    
    if (validatedQuery.priority !== undefined) {
      where.priority = validatedQuery.priority;
    }
    
    if (validatedQuery.workflowSid) {
      where.workflowSid = validatedQuery.workflowSid;
    }
    
    if (validatedQuery.queueSid) {
      where.queueSid = validatedQuery.queueSid;
    }

    const rules = await db.routingRule.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      skip: validatedQuery.offset,
      take: validatedQuery.limit,
    });

    const total = await db.routingRule.count({ where });

    return NextResponse.json({
      rules,
      total,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    });
  } catch (error) {
    console.error("Error fetching routing rules:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch routing rules" },
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

    // Only admins can create routing rules
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = routingRuleSchema.parse(body);

    const rule = await db.routingRule.create({
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

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating routing rule:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create routing rule" },
      { status: 500 }
    );
  }
}
