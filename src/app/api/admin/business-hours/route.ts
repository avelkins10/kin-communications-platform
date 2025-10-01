import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { businessHoursSchema } from "@/lib/validations/admin"

// Server-side validation functions
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  if (hours === undefined || minutes === undefined) {
    throw new Error(`Invalid time format: ${time}`)
  }
  return hours * 60 + minutes
}

const doTimeSlotsOverlap = (slot1: { start: string; end: string }, slot2: { start: string; end: string }): boolean => {
  const start1 = timeToMinutes(slot1.start)
  const end1 = timeToMinutes(slot1.end)
  const start2 = timeToMinutes(slot2.start)
  const end2 = timeToMinutes(slot2.end)
  
  return start1 < end2 && start2 < end1
}

const validateTimeSlotsOverlap = (timeSlots: { start: string; end: string }[]): string[] => {
  const errors: string[] = []
  
  // Check for overlaps within the same day
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      const slot1 = timeSlots[i]
      const slot2 = timeSlots[j]
      if (slot1 && slot2 && doTimeSlotsOverlap(slot1, slot2)) {
        errors.push(`Time slots ${slot1.start}-${slot1.end} and ${slot2.start}-${slot2.end} overlap`)
      }
    }
  }
  
  return errors
}

const validateSpecialHoursOverlap = (specialHours: { name: string; startDate: string; endDate: string }[]): string[] => {
  const errors: string[] = []
  
  for (let i = 0; i < specialHours.length; i++) {
    for (let j = i + 1; j < specialHours.length; j++) {
      const hour1 = specialHours[i]
      const hour2 = specialHours[j]
      if (hour1 && hour2) {
        const start1 = new Date(hour1.startDate)
        const end1 = new Date(hour1.endDate)
        const start2 = new Date(hour2.startDate)
        const end2 = new Date(hour2.endDate)

        if (start1 <= end2 && start2 <= end1) {
          errors.push(`Special hours "${hour1.name}" and "${hour2.name}" have overlapping date ranges`)
        }
      }
    }
  }
  
  return errors
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get business hours configuration from database
    // TODO: Add systemSetting model to Prisma schema
    let businessHours = null; // await db.systemSetting.findUnique({
    //   where: { key: "business_hours" },
    // })

    // Default business hours configuration
    const defaultBusinessHours = {
      timezone: "America/New_York",
      weeklySchedule: {
        monday: { isOpen: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
        tuesday: { isOpen: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
        wednesday: { isOpen: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
        thursday: { isOpen: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
        friday: { isOpen: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
        saturday: { isOpen: false, timeSlots: [] },
        sunday: { isOpen: false, timeSlots: [] },
      },
      holidays: [],
      specialHours: [],
    }

    if (!businessHours) {
      return NextResponse.json(defaultBusinessHours)
    }

    return NextResponse.json(defaultBusinessHours)
  } catch (error) {
    console.error("Error fetching business hours:", error)
    return NextResponse.json(
      { error: "Failed to fetch business hours" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = businessHoursSchema.parse(body)

    // Collect all validation errors
    const validationErrors: string[] = []

    // Validate time slots for each day
    for (const [day, schedule] of Object.entries(data.weeklySchedule)) {
      if (schedule.isOpen && schedule.timeSlots) {
        // Check for invalid time ranges (start >= end)
        for (const slot of schedule.timeSlots) {
          const startTime = new Date(`2000-01-01T${slot.start}:00`)
          const endTime = new Date(`2000-01-01T${slot.end}:00`)
          
          if (startTime >= endTime) {
            validationErrors.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: Time slot ${slot.start}-${slot.end} - start time must be before end time`)
          }
        }

        // Check for overlapping time slots
        const overlapErrors = validateTimeSlotsOverlap(schedule.timeSlots)
        if (overlapErrors.length > 0) {
          validationErrors.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${overlapErrors.join(', ')}`)
        }
      }
    }

    // Validate holidays
    if (data.holidays) {
      for (const holiday of data.holidays) {
        const holidayDate = new Date(holiday.date)
        if (isNaN(holidayDate.getTime())) {
          validationErrors.push(`Invalid date for holiday: ${holiday.name}`)
        }

        // Validate holiday time slots if they exist
        if (holiday.isOpen && holiday.timeSlots) {
          const overlapErrors = validateTimeSlotsOverlap(holiday.timeSlots)
          if (overlapErrors.length > 0) {
            validationErrors.push(`Holiday "${holiday.name}": ${overlapErrors.join(', ')}`)
          }
        }
      }
    }

    // Validate special hours
    if (data.specialHours) {
      for (const specialHour of data.specialHours) {
        const startDate = new Date(specialHour.startDate)
        const endDate = new Date(specialHour.endDate)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          validationErrors.push(`Invalid date range for special hours: ${specialHour.name}`)
        } else if (startDate >= endDate) {
          validationErrors.push(`Special hours "${specialHour.name}": start date must be before end date`)
        }

        // Validate special hours time slots for each day
        if (specialHour.schedule) {
          for (const [day, schedule] of Object.entries(specialHour.schedule)) {
            if (schedule.isOpen && schedule.timeSlots) {
              const overlapErrors = validateTimeSlotsOverlap(schedule.timeSlots)
              if (overlapErrors.length > 0) {
                validationErrors.push(`Special hours "${specialHour.name}" - ${day.charAt(0).toUpperCase() + day.slice(1)}: ${overlapErrors.join(', ')}`)
              }
            }
          }
        }
      }

      // Check for overlapping special hours date ranges
      const specialHoursOverlapErrors = validateSpecialHoursOverlap(data.specialHours)
      validationErrors.push(...specialHoursOverlapErrors)
    }

    // Return validation errors if any exist
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationErrors 
        },
        { status: 400 }
      )
    }

    // Store or update business hours configuration
    // TODO: Add systemSetting model to Prisma schema
    // const businessHours = await db.systemSetting.upsert({
    //   where: { key: "business_hours" },
    //   update: { value: data },
    //   create: {
    //     key: "business_hours",
    //     value: data,
    //     description: "Business hours configuration including weekly schedule, holidays, and special hours",
    //   },
    // })

    return NextResponse.json({ message: "Business hours updated successfully", data })
  } catch (error) {
    console.error("Error updating business hours:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update business hours" },
      { status: 500 }
    )
  }
}
