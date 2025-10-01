import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { quickbaseService } from "@/lib/quickbase/service";
import { customerLookupSchema } from "@/lib/validations/quickbase";
import { isTestMode, executeIfNotTestMode, MOCK_RESPONSES, logTestModeActivity } from "@/lib/test-mode";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const customerId = searchParams.get("customerId");

    // Validate request parameters
    const validationResult = customerLookupSchema.safeParse({
      phone: phone || undefined,
      email: email || undefined,
      customerId: customerId || undefined
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { phone: validatedPhone, email: validatedEmail, customerId: validatedCustomerId } = validationResult.data;

    let result;

    if (validatedPhone) {
      // Look up customer by phone number (or mock in test mode)
      result = await executeIfNotTestMode(
        () => quickbaseService.identifyCustomer(validatedPhone),
        {
          customer: MOCK_RESPONSES.quickbase.customer,
          found: true
        }
      );
    } else if (validatedEmail) {
      // Look up customer by email (or mock in test mode)
      const customer = await executeIfNotTestMode(
        () => quickbaseService.getCustomerByEmail(validatedEmail),
        MOCK_RESPONSES.quickbase.customer
      );
      result = {
        customer,
        found: !!customer
      };
    } else if (validatedCustomerId) {
      // Look up customer by ID (or mock in test mode)
      const customer = await executeIfNotTestMode(
        () => quickbaseService.getCustomerById(validatedCustomerId),
        MOCK_RESPONSES.quickbase.customer
      );
      const projectCoordinator = customer ? await executeIfNotTestMode(
        () => quickbaseService.getAssignedPC(customer.id),
        MOCK_RESPONSES.quickbase.projectCoordinator
      ) : null;
      const project = customer ? await executeIfNotTestMode(
        () => quickbaseService.getProjectDetails(customer.id),
        MOCK_RESPONSES.quickbase.project
      ) : null;
      
      result = {
        customer,
        projectCoordinator,
        project,
        found: !!customer
      };
    } else {
      return NextResponse.json(
        { error: "At least one lookup parameter is required" },
        { status: 400 }
      );
    }

    if (!result.found) {
      return NextResponse.json(
        { message: "Customer not found", found: false },
        { status: 404 }
      );
    }

    logTestModeActivity('Quickbase', 'Customer lookup', {
      phone: validatedPhone,
      email: validatedEmail,
      customerId: validatedCustomerId,
      found: result.found
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date(),
      testMode: isTestMode()
    });

  } catch (error) {
    console.error("Error in customer lookup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
