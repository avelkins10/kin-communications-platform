"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Clock, Calendar, Trash2, Edit, Save } from "lucide-react"
import { toast } from "sonner"
import { useBusinessHours } from "@/lib/hooks/use-admin"

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  isOpen: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface Holiday {
  name: string
  date: string
  isOpen: boolean
  timeSlots?: TimeSlot[]
}

interface SpecialHours {
  name: string
  startDate: string
  endDate: string
  schedule: WeeklySchedule
}

interface BusinessHours {
  timezone: string
  weeklySchedule: WeeklySchedule
  holidays: Holiday[]
  specialHours: SpecialHours[]
}

const defaultTimeSlot: TimeSlot = { start: "09:00", end: "17:00" }

const defaultDaySchedule: DaySchedule = {
  isOpen: true,
  timeSlots: [defaultTimeSlot],
}

const defaultWeeklySchedule: WeeklySchedule = {
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { isOpen: false, timeSlots: [] },
  sunday: { isOpen: false, timeSlots: [] },
}

const defaultBusinessHours: BusinessHours = {
  timezone: "America/New_York",
  weeklySchedule: defaultWeeklySchedule,
  holidays: [],
  specialHours: [],
}

// Validation functions
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const doTimeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  const start1 = timeToMinutes(slot1.start)
  const end1 = timeToMinutes(slot1.end)
  const start2 = timeToMinutes(slot2.start)
  const end2 = timeToMinutes(slot2.end)
  
  return start1 < end2 && start2 < end1
}

const validateTimeSlots = (timeSlots: TimeSlot[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Check for overlaps within the same day
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      if (doTimeSlotsOverlap(timeSlots[i], timeSlots[j])) {
        errors.push(`Time slots ${timeSlots[i].start}-${timeSlots[i].end} and ${timeSlots[j].start}-${timeSlots[j].end} overlap`)
      }
    }
  }
  
  // Check for invalid time ranges (start >= end)
  timeSlots.forEach((slot, index) => {
    if (timeToMinutes(slot.start) >= timeToMinutes(slot.end)) {
      errors.push(`Time slot ${index + 1}: Start time must be before end time`)
    }
  })
  
  return { isValid: errors.length === 0, errors }
}

const validateSpecialHoursOverlap = (specialHours: SpecialHours[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  for (let i = 0; i < specialHours.length; i++) {
    for (let j = i + 1; j < specialHours.length; j++) {
      const start1 = new Date(specialHours[i].startDate)
      const end1 = new Date(specialHours[i].endDate)
      const start2 = new Date(specialHours[j].startDate)
      const end2 = new Date(specialHours[j].endDate)
      
      if (start1 <= end2 && start2 <= end1) {
        errors.push(`Special hours "${specialHours[i].name}" and "${specialHours[j].name}" have overlapping date ranges`)
      }
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
]

const daysOfWeek = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

export function BusinessHoursConfig() {
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours)
  const [saving, setSaving] = useState(false)
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
  const [isSpecialHoursDialogOpen, setIsSpecialHoursDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [editingSpecialHours, setEditingSpecialHours] = useState<SpecialHours | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Use the shared hook for business hours
  const {
    data,
    loading,
    error,
    refetch,
    updateItem
  } = useBusinessHours()

  useEffect(() => {
    if (data) {
      setBusinessHours(data)
    }
  }, [data])

  const validateBusinessHours = (): boolean => {
    const errors: string[] = []
    
    // Validate weekly schedule time slots
    Object.entries(businessHours.weeklySchedule || {}).forEach(([day, schedule]) => {
      if (schedule.isOpen && schedule.timeSlots.length > 0) {
        const validation = validateTimeSlots(schedule.timeSlots)
        if (!validation.isValid) {
          errors.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${validation.errors.join(', ')}`)
        }
      }
    })
    
    // Validate special hours overlaps
    const specialHoursValidation = validateSpecialHoursOverlap(businessHours.specialHours)
    if (!specialHoursValidation.isValid) {
      errors.push(...specialHoursValidation.errors)
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!validateBusinessHours()) {
      toast.error("Please fix validation errors before saving")
      return
    }

    try {
      setSaving(true)
      await updateItem(businessHours)
      toast.success("Business hours saved successfully")
      setValidationErrors([])
    } catch (error) {
      console.error("Error saving business hours:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save business hours")
    } finally {
      setSaving(false)
    }
  }

  const updateDaySchedule = (day: keyof WeeklySchedule, schedule: DaySchedule) => {
    setBusinessHours(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: schedule,
      },
    }))
  }

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const daySchedule = businessHours.weeklySchedule[day]
    updateDaySchedule(day, {
      ...daySchedule,
      timeSlots: [...daySchedule.timeSlots, { start: "09:00", end: "17:00" }],
    })
  }

  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    const daySchedule = businessHours.weeklySchedule[day]
    updateDaySchedule(day, {
      ...daySchedule,
      timeSlots: daySchedule.timeSlots.filter((_, i) => i !== index),
    })
  }

  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: keyof TimeSlot, value: string) => {
    const daySchedule = businessHours.weeklySchedule[day]
    const newTimeSlots = [...daySchedule.timeSlots]
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value }
    updateDaySchedule(day, {
      ...daySchedule,
      timeSlots: newTimeSlots,
    })
    
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const addHoliday = (holiday: Holiday) => {
    setBusinessHours(prev => ({
      ...prev,
      holidays: [...prev.holidays, holiday],
    }))
  }

  const updateHoliday = (index: number, holiday: Holiday) => {
    setBusinessHours(prev => ({
      ...prev,
      holidays: prev.holidays.map((h, i) => i === index ? holiday : h),
    }))
  }

  const removeHoliday = (index: number) => {
    setBusinessHours(prev => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== index),
    }))
  }

  const addSpecialHours = (specialHours: SpecialHours) => {
    setBusinessHours(prev => ({
      ...prev,
      specialHours: [...prev.specialHours, specialHours],
    }))
  }

  const updateSpecialHours = (index: number, specialHours: SpecialHours) => {
    setBusinessHours(prev => ({
      ...prev,
      specialHours: prev.specialHours.map((s, i) => i === index ? specialHours : s),
    }))
  }

  const removeSpecialHours = (index: number) => {
    setBusinessHours(prev => ({
      ...prev,
      specialHours: prev.specialHours.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Hours Configuration</h2>
          <p className="text-muted-foreground">
            Configure operating hours, holidays, and special schedules
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Validation Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="special">Special Hours</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Set operating hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {daysOfWeek.map(({ key, label }) => {
                const dayKey = key as keyof WeeklySchedule
                const daySchedule = businessHours.weeklySchedule[dayKey]
                
                return (
                  <div key={key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={daySchedule.isOpen}
                          onCheckedChange={(checked) => updateDaySchedule(dayKey, {
                            ...daySchedule,
                            isOpen: checked,
                          })}
                        />
                        <Label className="text-base font-medium">{label}</Label>
                      </div>
                      {daySchedule.isOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(dayKey)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      )}
                    </div>

                    {daySchedule.isOpen && (
                      <div className="space-y-2">
                        {daySchedule.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(dayKey, index, "start", e.target.value)}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(dayKey, index, "end", e.target.value)}
                              className="w-32"
                            />
                            {daySchedule.timeSlots.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(dayKey, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Holidays</CardTitle>
                  <CardDescription>
                    Configure special hours for holidays
                  </CardDescription>
                </div>
                <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Holiday
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                      </DialogTitle>
                    </DialogHeader>
                    <HolidayForm
                      holiday={editingHoliday}
                      onSave={(holiday) => {
                        if (editingHoliday) {
                          const index = businessHours.holidays.findIndex(h => h === editingHoliday)
                          updateHoliday(index, holiday)
                        } else {
                          addHoliday(holiday)
                        }
                        setIsHolidayDialogOpen(false)
                        setEditingHoliday(null)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessHours.holidays.map((holiday, index) => (
                    <TableRow key={index}>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{holiday.date}</TableCell>
                      <TableCell>
                        <Badge variant={holiday.isOpen ? "default" : "secondary"}>
                          {holiday.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingHoliday(holiday)
                              setIsHolidayDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHoliday(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Special Hours</CardTitle>
                  <CardDescription>
                    Configure special operating hours for events or seasons
                  </CardDescription>
                </div>
                <Dialog open={isSpecialHoursDialogOpen} onOpenChange={setIsSpecialHoursDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Special Hours
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSpecialHours ? "Edit Special Hours" : "Add Special Hours"}
                      </DialogTitle>
                    </DialogHeader>
                    <SpecialHoursForm
                      specialHours={editingSpecialHours}
                      onSave={(specialHours) => {
                        if (editingSpecialHours) {
                          const index = businessHours.specialHours.findIndex(s => s === editingSpecialHours)
                          updateSpecialHours(index, specialHours)
                        } else {
                          addSpecialHours(specialHours)
                        }
                        setIsSpecialHoursDialogOpen(false)
                        setEditingSpecialHours(null)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessHours.specialHours.map((specialHours, index) => (
                    <TableRow key={index}>
                      <TableCell>{specialHours.name}</TableCell>
                      <TableCell>{specialHours.startDate}</TableCell>
                      <TableCell>{specialHours.endDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSpecialHours(specialHours)
                              setIsSpecialHoursDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecialHours(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure timezone and other business hours settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={businessHours.timezone}
                  onValueChange={(value) => setBusinessHours(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface HolidayFormProps {
  holiday: Holiday | null
  onSave: (holiday: Holiday) => void
}

function HolidayForm({ holiday, onSave }: HolidayFormProps) {
  const [formData, setFormData] = useState({
    name: holiday?.name || "",
    date: holiday?.date || "",
    isOpen: holiday?.isOpen || false,
    timeSlots: holiday?.timeSlots || [defaultTimeSlot],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      date: formData.date,
      isOpen: formData.isOpen,
      timeSlots: formData.isOpen ? formData.timeSlots : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Holiday Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Christmas Day"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isOpen}
          onCheckedChange={(checked) => setFormData({ ...formData, isOpen: checked })}
        />
        <Label>Open on this holiday</Label>
      </div>

      {formData.isOpen && (
        <div className="space-y-2">
          <Label>Operating Hours</Label>
          {formData.timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="time"
                value={slot.start}
                onChange={(e) => {
                  const newTimeSlots = [...formData.timeSlots]
                  newTimeSlots[index] = { ...newTimeSlots[index], start: e.target.value }
                  setFormData({ ...formData, timeSlots: newTimeSlots })
                }}
                className="w-32"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={slot.end}
                onChange={(e) => {
                  const newTimeSlots = [...formData.timeSlots]
                  newTimeSlots[index] = { ...newTimeSlots[index], end: e.target.value }
                  setFormData({ ...formData, timeSlots: newTimeSlots })
                }}
                className="w-32"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit">Save Holiday</Button>
      </div>
    </form>
  )
}

interface SpecialHoursFormProps {
  specialHours: SpecialHours | null
  onSave: (specialHours: SpecialHours) => void
}

function SpecialHoursForm({ specialHours, onSave }: SpecialHoursFormProps) {
  const [formData, setFormData] = useState({
    name: specialHours?.name || "",
    startDate: specialHours?.startDate || "",
    endDate: specialHours?.endDate || "",
    schedule: specialHours?.schedule || defaultWeeklySchedule,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Black Friday Sale"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Special Schedule</Label>
        <p className="text-sm text-muted-foreground">
          Configure the operating hours for this special period. Leave as default to use regular business hours.
        </p>
        
        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const dayKey = key as keyof WeeklySchedule
            const daySchedule = formData.schedule[dayKey]
            
            return (
              <div key={key} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={daySchedule.isOpen}
                      onCheckedChange={(checked) => {
                        const newSchedule = { ...formData.schedule }
                        newSchedule[dayKey] = {
                          ...daySchedule,
                          isOpen: checked,
                          timeSlots: checked ? daySchedule.timeSlots.length > 0 ? daySchedule.timeSlots : [defaultTimeSlot] : []
                        }
                        setFormData({ ...formData, schedule: newSchedule })
                      }}
                    />
                    <Label className="text-base font-medium">{label}</Label>
                  </div>
                  {daySchedule.isOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSchedule = { ...formData.schedule }
                        newSchedule[dayKey] = {
                          ...daySchedule,
                          timeSlots: [...daySchedule.timeSlots, { start: "09:00", end: "17:00" }]
                        }
                        setFormData({ ...formData, schedule: newSchedule })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  )}
                </div>

                {daySchedule.isOpen && (
                  <div className="space-y-2">
                    {daySchedule.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSchedule = { ...formData.schedule }
                            const newTimeSlots = [...daySchedule.timeSlots]
                            newTimeSlots[index] = { ...newTimeSlots[index], start: e.target.value }
                            newSchedule[dayKey] = { ...daySchedule, timeSlots: newTimeSlots }
                            setFormData({ ...formData, schedule: newSchedule })
                          }}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSchedule = { ...formData.schedule }
                            const newTimeSlots = [...daySchedule.timeSlots]
                            newTimeSlots[index] = { ...newTimeSlots[index], end: e.target.value }
                            newSchedule[dayKey] = { ...daySchedule, timeSlots: newTimeSlots }
                            setFormData({ ...formData, schedule: newSchedule })
                          }}
                          className="w-32"
                        />
                        {daySchedule.timeSlots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSchedule = { ...formData.schedule }
                              newSchedule[dayKey] = {
                                ...daySchedule,
                                timeSlots: daySchedule.timeSlots.filter((_, i) => i !== index)
                              }
                              setFormData({ ...formData, schedule: newSchedule })
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Save Special Hours</Button>
      </div>
    </form>
  )
}
