"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Phone, ShoppingCart, Settings, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { usePhoneNumbers, usePhoneNumberSearch } from "@/lib/hooks/use-admin"

interface PhoneNumber {
  id: string
  sid: string
  phoneNumber: string
  friendlyName: string
  capabilities: string[]
  status: string
  voiceUrl?: string
  smsUrl?: string
  statusCallback?: string
  voiceMethod: string
  smsMethod: string
  statusCallbackMethod: string
  createdAt: string
  _count: {
    calls: number
    messages: number
  }
}

interface SearchResult {
  phoneNumber: string
  friendlyName: string
  capabilities: string[]
  region: string
  locality: string
  rateCenter: string
  latitude?: number
  longitude?: number
  addressRequirements: string
  beta: boolean
  type: "local" | "toll-free"
}

interface SearchCriteria {
  areaCode?: string
  contains?: string
  nearLatLong?: string
  nearNumber?: string
  nearPostalCode?: string
  nearRegion?: string
  inRegion?: string
  inPostalCode?: string
  inLata?: string
  inRateCenter?: string
  inLocality?: string
  faxEnabled?: boolean
  mmsEnabled?: boolean
  smsEnabled?: boolean
  voiceEnabled?: boolean
  excludeAllAddressRequired?: boolean
  excludeForeignAddressRequired?: boolean
  excludeLocalAddressRequired?: boolean
  beta?: boolean
  distance?: number
  limit: number
}

const defaultSearchCriteria: SearchCriteria = {
  limit: 20,
}

export function PhoneNumberManagement() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all")
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [configuringNumber, setConfiguringNumber] = useState<PhoneNumber | null>(null)
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(defaultSearchCriteria)
  const [submitting, setSubmitting] = useState(false)

  // Use the shared hooks for phone number management
  const { 
    data: phoneNumbers, 
    loading, 
    error, 
    refetch, 
    createItem, 
    updateItem, 
    deleteItem 
  } = usePhoneNumbers()

  const { 
    searchPhoneNumbers, 
    loading: searchLoading 
  } = usePhoneNumberSearch()

  // Refetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      refetch()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, statusFilter, capabilityFilter, refetch])

  const handleSearchNumbers = async () => {
    try {
      setSearching(true)
      const results = await searchPhoneNumbers(searchCriteria)
      setSearchResults([...(results.local || []), ...(results.tollFree || [])])
    } catch (error) {
      // handled in hook
    } finally {
      setSearching(false)
    }
  }

  const handlePurchaseNumber = async (phoneNumber: string) => {
    try {
      setSubmitting(true)
      await createItem({
        phoneNumber,
        friendlyName: `KIN Communications - ${phoneNumber}`,
      })
      
      toast.success("Phone number purchased successfully")
      setIsSearchDialogOpen(false)
      setSearchResults([])
      setSearchCriteria(defaultSearchCriteria)
    } catch (error) {
      console.error("Error purchasing phone number:", error)
      toast.error(error instanceof Error ? error.message : "Failed to purchase phone number")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateNumber = async (numberId: string, updates: Partial<PhoneNumber>) => {
    try {
      setSubmitting(true)
      await updateItem(numberId, updates)
      
      toast.success("Phone number updated successfully")
      setIsConfigDialogOpen(false)
      setConfiguringNumber(null)
    } catch (error) {
      console.error("Error updating phone number:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update phone number")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNumber = async (numberId: string) => {
    if (!confirm("Are you sure you want to release this phone number? This action cannot be undone.")) return

    try {
      await deleteItem(numberId)
      toast.success("Phone number released successfully")
    } catch (error) {
      console.error("Error releasing phone number:", error)
      toast.error(error instanceof Error ? error.message : "Failed to release phone number")
    }
  }

  const openConfigDialog = (phoneNumber: PhoneNumber) => {
    setConfiguringNumber(phoneNumber)
    setIsConfigDialogOpen(true)
  }

  const getCapabilityBadges = (capabilities: string[]) => {
    return capabilities.map((capability) => (
      <Badge key={capability} variant="secondary" className="text-xs">
        {capability.toUpperCase()}
      </Badge>
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Phone Number Management</h2>
          <p className="text-muted-foreground">
            Purchase, configure, and manage Twilio phone numbers
          </p>
        </div>
        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Purchase Number
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Search and Purchase Phone Numbers</DialogTitle>
            </DialogHeader>
            <PhoneNumberSearch
              searchCriteria={searchCriteria}
              setSearchCriteria={setSearchCriteria}
              searchResults={searchResults}
              onSearch={handleSearchNumbers}
              onPurchase={handlePurchaseNumber}
              searching={searching}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search phone numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capability">Capability</Label>
              <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All capabilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All capabilities</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="mms">MMS</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={refetch} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Numbers ({phoneNumbers.length})</CardTitle>
          <CardDescription>
            Manage your Twilio phone numbers and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Friendly Name</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="font-mono">{number.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>{number.friendlyName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getCapabilityBadges(number.capabilities)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(number.status)}>
                        {number.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{number._count.calls} calls</div>
                        <div>{number._count.messages} messages</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openConfigDialog(number)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/${number.sid}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNumber(number.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Phone Number</DialogTitle>
          </DialogHeader>
          {configuringNumber && (
            <PhoneNumberConfig
              phoneNumber={configuringNumber}
              onUpdate={handleUpdateNumber}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface PhoneNumberSearchProps {
  searchCriteria: SearchCriteria
  setSearchCriteria: (criteria: SearchCriteria) => void
  searchResults: SearchResult[]
  onSearch: () => void
  onPurchase: (phoneNumber: string) => void
  searching: boolean
  submitting: boolean
}

function PhoneNumberSearch({
  searchCriteria,
  setSearchCriteria,
  searchResults,
  onSearch,
  onPurchase,
  searching,
  submitting,
}: PhoneNumberSearchProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Criteria</TabsTrigger>
          <TabsTrigger value="results">Search Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="areaCode">Area Code</Label>
              <Input
                id="areaCode"
                value={searchCriteria.areaCode || ""}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, areaCode: e.target.value })}
                placeholder="e.g., 555"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contains">Contains</Label>
              <Input
                id="contains"
                value={searchCriteria.contains || ""}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, contains: e.target.value })}
                placeholder="e.g., 123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nearPostalCode">Near Postal Code</Label>
              <Input
                id="nearPostalCode"
                value={searchCriteria.nearPostalCode || ""}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, nearPostalCode: e.target.value })}
                placeholder="e.g., 10001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nearRegion">Near Region</Label>
              <Input
                id="nearRegion"
                value={searchCriteria.nearRegion || ""}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, nearRegion: e.target.value })}
                placeholder="e.g., NY"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Capabilities</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="voiceEnabled"
                  checked={searchCriteria.voiceEnabled || false}
                  onCheckedChange={(checked) => setSearchCriteria({ ...searchCriteria, voiceEnabled: checked })}
                />
                <Label htmlFor="voiceEnabled">Voice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={searchCriteria.smsEnabled || false}
                  onCheckedChange={(checked) => setSearchCriteria({ ...searchCriteria, smsEnabled: checked })}
                />
                <Label htmlFor="smsEnabled">SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="mmsEnabled"
                  checked={searchCriteria.mmsEnabled || false}
                  onCheckedChange={(checked) => setSearchCriteria({ ...searchCriteria, mmsEnabled: checked })}
                />
                <Label htmlFor="mmsEnabled">MMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="faxEnabled"
                  checked={searchCriteria.faxEnabled || false}
                  onCheckedChange={(checked) => setSearchCriteria({ ...searchCriteria, faxEnabled: checked })}
                />
                <Label htmlFor="faxEnabled">Fax</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Results Limit</Label>
            <Input
              id="limit"
              type="number"
              value={searchCriteria.limit}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, limit: parseInt(e.target.value) || 20 })}
              min={1}
              max={1000}
            />
          </div>

          <Button onClick={onSearch} disabled={searching} className="w-full">
            {searching ? "Searching..." : "Search Numbers"}
          </Button>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No search results. Try adjusting your search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {searchResults.length} available numbers
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((result) => (
                  <Card key={result.phoneNumber} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-mono font-medium">{result.phoneNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.locality}, {result.region} • {result.rateCenter}
                        </div>
                        <div className="flex gap-1">
                          {getCapabilityBadges(result.capabilities)}
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onPurchase(result.phoneNumber)}
                        disabled={submitting}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface PhoneNumberConfigProps {
  phoneNumber: PhoneNumber
  onUpdate: (id: string, updates: Partial<PhoneNumber>) => void
  submitting: boolean
}

function PhoneNumberConfig({ phoneNumber, onUpdate, submitting }: PhoneNumberConfigProps) {
  const [formData, setFormData] = useState({
    friendlyName: phoneNumber.friendlyName,
    voiceUrl: phoneNumber.voiceUrl || "",
    smsUrl: phoneNumber.smsUrl || "",
    statusCallback: phoneNumber.statusCallback || "",
    voiceMethod: phoneNumber.voiceMethod,
    smsMethod: phoneNumber.smsMethod,
    statusCallbackMethod: phoneNumber.statusCallbackMethod,
  })

  const handleSubmit = () => {
    onUpdate(phoneNumber.id, formData)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="friendlyName">Friendly Name</Label>
        <Input
          id="friendlyName"
          value={formData.friendlyName}
          onChange={(e) => setFormData({ ...formData, friendlyName: e.target.value })}
          placeholder="Enter friendly name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voiceUrl">Voice Webhook URL</Label>
        <Input
          id="voiceUrl"
          value={formData.voiceUrl}
          onChange={(e) => setFormData({ ...formData, voiceUrl: e.target.value })}
          placeholder="https://your-domain.com/api/webhooks/twilio/voice"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="smsUrl">SMS Webhook URL</Label>
        <Input
          id="smsUrl"
          value={formData.smsUrl}
          onChange={(e) => setFormData({ ...formData, smsUrl: e.target.value })}
          placeholder="https://your-domain.com/api/webhooks/twilio/sms"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="statusCallback">Status Callback URL</Label>
        <Input
          id="statusCallback"
          value={formData.statusCallback}
          onChange={(e) => setFormData({ ...formData, statusCallback: e.target.value })}
          placeholder="https://your-domain.com/api/webhooks/twilio/status"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="voiceMethod">Voice Method</Label>
          <Select value={formData.voiceMethod} onValueChange={(value) => setFormData({ ...formData, voiceMethod: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="smsMethod">SMS Method</Label>
          <Select value={formData.smsMethod} onValueChange={(value) => setFormData({ ...formData, smsMethod: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusCallbackMethod">Status Method</Label>
          <Select value={formData.statusCallbackMethod} onValueChange={(value) => setFormData({ ...formData, statusCallbackMethod: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setFormData({
          friendlyName: phoneNumber.friendlyName,
          voiceUrl: phoneNumber.voiceUrl || "",
          smsUrl: phoneNumber.smsUrl || "",
          statusCallback: phoneNumber.statusCallback || "",
          voiceMethod: phoneNumber.voiceMethod,
          smsMethod: phoneNumber.smsMethod,
          statusCallbackMethod: phoneNumber.statusCallbackMethod,
        })}>
          Reset
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  )
}

function getCapabilityBadges(capabilities: string[]) {
  return capabilities.map((capability) => (
    <Badge key={capability} variant="secondary" className="text-xs">
      {capability.toUpperCase()}
    </Badge>
  ))
}
