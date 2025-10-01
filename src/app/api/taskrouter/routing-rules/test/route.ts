import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { routingEngine } from "@/lib/twilio/routing";
import { routingRulesTestSchema } from "@/lib/validations/taskrouter";

export async function POST(request: NextRequest) {
  try {
    // Auth-check the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validated = routingRulesTestSchema.parse(body);

    // Call the routing engine to evaluate routing rules
    const ruleResult = await routingEngine.evaluateRoutingRules(validated.attributes, {
      phoneNumber: validated.phoneNumber,
      keywords: validated.text ? (await routingEngine.detectKeywords(validated.text)).keywords : undefined,
      time: new Date(),
      customerData: await routingEngine.getQuickbaseRouting(validated.phoneNumber ?? ""),
    });

    // Build response with success flag and routing rules evaluation
    const response = {
      success: ruleResult.matched,
      routingRulesEvaluation: ruleResult,
      summary: ruleResult.matched 
        ? `Routing rule matched with ${ruleResult.actions.length} action(s)`
        : "No routing rules matched the provided criteria",
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error in routing rules test endpoint:", error);

    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { 
          error: "Validation error", 
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}