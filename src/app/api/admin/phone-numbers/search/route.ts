import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { phoneNumberSearchSchema } from "@/lib/validations/admin"
import { twilioClient } from "@/lib/twilio/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const searchCriteria = phoneNumberSearchSchema.parse(body)

    // Build Twilio search parameters
    const searchParams: any = {
      limit: searchCriteria.limit,
    }

    if (searchCriteria.areaCode) {
      searchParams.areaCode = searchCriteria.areaCode
    }

    if (searchCriteria.contains) {
      searchParams.contains = searchCriteria.contains
    }

    if (searchCriteria.nearLatLong) {
      searchParams.nearLatLong = searchCriteria.nearLatLong
    }

    if (searchCriteria.nearNumber) {
      searchParams.nearNumber = searchCriteria.nearNumber
    }

    if (searchCriteria.nearPostalCode) {
      searchParams.nearPostalCode = searchCriteria.nearPostalCode
    }

    if (searchCriteria.nearRegion) {
      searchParams.nearRegion = searchCriteria.nearRegion
    }

    if (searchCriteria.inRegion) {
      searchParams.inRegion = searchCriteria.inRegion
    }

    if (searchCriteria.inPostalCode) {
      searchParams.inPostalCode = searchCriteria.inPostalCode
    }

    if (searchCriteria.inLata) {
      searchParams.inLata = searchCriteria.inLata
    }

    if (searchCriteria.inRateCenter) {
      searchParams.inRateCenter = searchCriteria.inRateCenter
    }

    if (searchCriteria.inLocality) {
      searchParams.inLocality = searchCriteria.inLocality
    }

    if (searchCriteria.faxEnabled !== undefined) {
      searchParams.faxEnabled = searchCriteria.faxEnabled
    }

    if (searchCriteria.mmsEnabled !== undefined) {
      searchParams.mmsEnabled = searchCriteria.mmsEnabled
    }

    if (searchCriteria.smsEnabled !== undefined) {
      searchParams.smsEnabled = searchCriteria.smsEnabled
    }

    if (searchCriteria.voiceEnabled !== undefined) {
      searchParams.voiceEnabled = searchCriteria.voiceEnabled
    }

    if (searchCriteria.excludeAllAddressRequired !== undefined) {
      searchParams.excludeAllAddressRequired = searchCriteria.excludeAllAddressRequired
    }

    if (searchCriteria.excludeForeignAddressRequired !== undefined) {
      searchParams.excludeForeignAddressRequired = searchCriteria.excludeForeignAddressRequired
    }

    if (searchCriteria.excludeLocalAddressRequired !== undefined) {
      searchParams.excludeLocalAddressRequired = searchCriteria.excludeLocalAddressRequired
    }

    if (searchCriteria.beta !== undefined) {
      searchParams.beta = searchCriteria.beta
    }

    if (searchCriteria.distance) {
      searchParams.distance = searchCriteria.distance
    }

    // Search for local numbers
    const localNumbers = await twilioClient.availablePhoneNumbers("US").local.list(searchParams)

    // Search for toll-free numbers if requested
    let tollFreeNumbers: any[] = []
    if (searchCriteria.areaCode === undefined && searchCriteria.contains === undefined) {
      try {
        tollFreeNumbers = await twilioClient.availablePhoneNumbers("US").tollFree.list({
          ...searchParams,
          limit: Math.min(searchParams.limit, 10), // Limit toll-free results
        })
      } catch (error) {
        console.warn("Error fetching toll-free numbers:", error)
      }
    }

    // Helper function to normalize capabilities
    const normalizeCapabilities = (capabilities: any) => {
      return Object.entries(capabilities)
        .filter(([_, enabled]) => enabled)
        .map(([capability, _]) => capability)
    }

    // Format results
    const results = {
      local: localNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: normalizeCapabilities(number.capabilities),
        region: number.region,
        locality: number.locality,
        rateCenter: number.rateCenter,
        lata: number.lata,
        latitude: number.latitude,
        longitude: number.longitude,
        addressRequirements: number.addressRequirements,
        beta: number.beta,
        type: "local",
      })),
      tollFree: tollFreeNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: normalizeCapabilities(number.capabilities),
        region: number.region,
        locality: number.locality,
        rateCenter: number.rateCenter,
        lata: number.lata,
        latitude: number.latitude,
        longitude: number.longitude,
        addressRequirements: number.addressRequirements,
        beta: number.beta,
        type: "toll-free",
      })),
      total: localNumbers.length + tollFreeNumbers.length,
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching phone numbers:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid search criteria", details: error.message },
        { status: 400 }
      )
    }
    
    // Handle Twilio API errors
    if (error instanceof Error && error.message.includes("Twilio")) {
      return NextResponse.json(
        { error: "Failed to search phone numbers", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to search phone numbers" },
      { status: 500 }
    )
  }
}
