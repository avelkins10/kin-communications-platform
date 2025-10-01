import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateTwiML, generateForwardTwiML, generateEnqueueTwiML, generateRecordingTwiML, generateRedirectTwiML } from "@/lib/twilio/twiml"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse form data from Twilio webhook
    const formData = await request.formData()
    const digits = formData.get("Digits") as string
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    
    // Get base URL for callbacks and redirects
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    // Find the IVR menu
    const ivrMenu = await db.iVRMenu.findUnique({
      where: { id },
    })

    if (!ivrMenu || !ivrMenu.isActive) {
      return new Response(
        generateTwiML({
          say: "Sorry, this menu is not available. Please try again later.",
          hangup: true,
        }),
        {
          headers: { "Content-Type": "text/xml" },
        }
      )
    }

    // Find the selected option
    const selectedOption = ivrMenu.options.find(option => option.digit === digits)

    if (!selectedOption) {
      // Invalid digit - handle according to invalidAction
      if (ivrMenu.invalidAction?.type === "hangup") {
        return new Response(
          generateTwiML({
            say: "Invalid selection. Goodbye.",
            hangup: true,
          }),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )
      } else if (ivrMenu.invalidAction?.type === "transfer" && ivrMenu.invalidAction.target) {
        return new Response(
          generateTwiML({
            say: "Transferring you to an agent.",
            hangup: false,
          }),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )
      } else {
        // Default: redirect back to menu
        const menuUrl = `${baseUrl}/api/admin/ivr/${id}`
        
        return new Response(
          generateRedirectTwiML(menuUrl, "POST"),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )
      }
    }

    // Process the selected action
    const action = selectedOption.action

    switch (action.type) {
      case "hangup":
        return new Response(
          generateTwiML({
            say: "Thank you for calling. Goodbye.",
            hangup: true,
          }),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )

      case "transfer":
        if (action.target) {
          return new Response(
            generateForwardTwiML(action.target),
            {
              headers: { "Content-Type": "text/xml" },
            }
          )
        }
        break

      case "queue":
        if (action.queueSid) {
          // Create task attributes with call context
          const taskAttributes = {
            queueSid: action.queueSid,
            origin: "ivr",
            callSid: callSid,
            from: from,
            to: to,
            ivrMenuId: ivrMenu.id,
            selectedOption: selectedOption.digit,
            timestamp: new Date().toISOString()
          }
          
          return new Response(
            generateEnqueueTwiML(
              action.queueSid,
              "Please hold while we connect you to an available agent.",
              undefined, // workflowSid - can be added later if needed
              taskAttributes
            ),
            {
              headers: { "Content-Type": "text/xml" },
            }
          )
        }
        break

      case "menu":
        if (action.menuId) {
          // Navigate to another IVR menu using redirect
          const menuUrl = `${baseUrl}/api/admin/ivr/${action.menuId}`
          
          return new Response(
            generateRedirectTwiML(menuUrl, "POST"),
            {
              headers: { "Content-Type": "text/xml" },
            }
          )
        }
        break

      case "voicemail":
        // Get recording callback URL
        const recordingCallbackUrl = `${baseUrl}/api/webhooks/twilio/recording`
        
        return new Response(
          generateRecordingTwiML(
            "Please leave your message after the beep.",
            recordingCallbackUrl,
            300 // maxLength in seconds
          ),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )

      case "message":
        if (action.target) {
          return new Response(
            generateTwiML({
              say: action.target,
              hangup: true,
            }),
            {
              headers: { "Content-Type": "text/xml" },
            }
          )
        }
        break

      default:
        // Redirect back to menu for unknown action types
        const menuUrl = `${baseUrl}/api/admin/ivr/${id}`
        
        return new Response(
          generateRedirectTwiML(menuUrl, "POST"),
          {
            headers: { "Content-Type": "text/xml" },
          }
        )
    }

    // Log the call interaction
    await db.call.create({
      data: {
        sid: callSid,
        from: from,
        to: to,
        status: "in-progress",
        direction: "inbound",
        iVRMenuId: ivrMenu.id,
        selectedOption: selectedOption.digit,
        actionType: action.type,
        actionTarget: action.target || action.queueSid || action.menuId,
      },
    })

    // Default fallback
    return new Response(
      generateTwiML({
        say: "Thank you for calling. Please hold while we connect you.",
        hangup: false,
      }),
      {
        headers: { "Content-Type": "text/xml" },
      }
    )
  } catch (error) {
    console.error("Error processing IVR digit:", error)
    return new Response(
      generateTwiML({
        say: "Sorry, there was an error processing your request. Please try again later.",
        hangup: true,
      }),
      {
        headers: { "Content-Type": "text/xml" },
        status: 500,
      }
    )
  }
}
