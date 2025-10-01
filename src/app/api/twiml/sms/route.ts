import { NextRequest, NextResponse } from "next/server"
import { twiml } from "twilio"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const messageSid = formData.get("MessageSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    console.log("SMS TwiML request:", { messageSid, from, to, body })

    const response = new twiml.MessagingResponse()

    // Simple auto-responder for now
    // In a real implementation, you'd process the message and route it appropriately
    if (body) {
      const lowerBody = body.toLowerCase().trim()
      
      if (lowerBody.includes("help") || lowerBody.includes("support")) {
        response.message("Thank you for contacting KIN Communications. For support, please call us at 1-800-KIN-HELP or visit our website.")
      } else if (lowerBody.includes("hours") || lowerBody.includes("time")) {
        response.message("Our business hours are Monday-Friday 9AM-6PM EST. We're here to help!")
      } else if (lowerBody.includes("stop") || lowerBody.includes("unsubscribe")) {
        response.message("You have been unsubscribed from our SMS notifications. Reply START to resubscribe.")
      } else {
        response.message("Thank you for your message. A representative will respond to you shortly. For immediate assistance, please call us at 1-800-KIN-HELP.")
      }
    } else {
      response.message("Thank you for contacting KIN Communications. How can we help you today?")
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in SMS TwiML:", error)
    
    const response = new twiml.MessagingResponse()
    response.message("We're experiencing technical difficulties. Please try again later or call us at 1-800-KIN-HELP.")

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

    const response = new twiml.MessagingResponse()

    if (action === "welcome") {
      response.message("Welcome to KIN Communications! Text HELP for assistance or call us at 1-800-KIN-HELP.")
    } else {
      response.message("Thank you for contacting KIN Communications. How can we help you today?")
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error in SMS TwiML GET:", error)
    
    const response = new twiml.MessagingResponse()
    response.message("We're experiencing technical difficulties. Please try again later.")

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
