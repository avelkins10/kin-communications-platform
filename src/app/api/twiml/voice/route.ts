import { NextRequest, NextResponse } from "next/server"
import { twiml } from "twilio"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const digits = formData.get("Digits") as string

    console.log("Voice TwiML request:", { callSid, from, to, digits })

    const response = new twiml.VoiceResponse()

    // If no digits provided, this is the initial call
    if (!digits) {
      // Play welcome message and gather input
      response.say("Thank you for calling KIN Communications. Please listen to the following options.")
      
      const gather = response.gather({
        numDigits: 1,
        timeout: 10,
        action: "/api/twiml/voice",
        method: "POST"
      })
      
      gather.say("Press 1 for sales. Press 2 for support. Press 3 for billing. Press 0 to speak with an operator.")
      
      // If no input, redirect to operator
      response.say("I didn't receive any input. Let me transfer you to an operator.")
      response.redirect("/api/twiml/voice?action=operator")
    } else {
      // Process the menu selection
      switch (digits) {
        case "1":
          response.say("You selected sales. Please hold while we transfer you to our sales team.")
          response.redirect("/api/twiml/voice?action=transfer&department=sales")
          break
        case "2":
          response.say("You selected support. Please hold while we transfer you to our support team.")
          response.redirect("/api/twiml/voice?action=transfer&department=support")
          break
        case "3":
          response.say("You selected billing. Please hold while we transfer you to our billing team.")
          response.redirect("/api/twiml/voice?action=transfer&department=billing")
          break
        case "0":
          response.say("Please hold while we transfer you to an operator.")
          response.redirect("/api/twiml/voice?action=transfer&department=operator")
          break
        default:
          response.say("Invalid selection. Please try again.")
          response.redirect("/api/twiml/voice")
          break
      }
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in voice TwiML:", error)
    
    const response = new twiml.VoiceResponse()
    response.say("We're experiencing technical difficulties. Please try again later.")
    response.hangup()

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const department = searchParams.get("department")

    const response = new twiml.VoiceResponse()

    if (action === "transfer" && department) {
      // For now, we'll use a simple transfer
      // In a real implementation, you'd look up the appropriate number or queue
      response.say(`Transferring you to ${department}. Please hold.`)
      
      // You would typically use TaskRouter or a specific phone number here
      // For now, we'll just hang up after announcing the transfer
      response.say("Thank you for calling. Goodbye.")
      response.hangup()
    } else if (action === "operator") {
      response.say("Please hold while we connect you to an operator.")
      // Again, you'd implement actual transfer logic here
      response.say("Thank you for calling. Goodbye.")
      response.hangup()
    } else {
      // Default behavior - redirect to POST handler
      response.redirect("/api/twiml/voice")
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in voice TwiML GET:", error)
    
    const response = new twiml.VoiceResponse()
    response.say("We're experiencing technical difficulties. Please try again later.")
    response.hangup()

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
