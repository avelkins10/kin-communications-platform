"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useMessageTemplates } from "@/lib/hooks/use-messages";
import { useMessages } from "@/lib/hooks/use-messages";
import { Contact, ContactType, MessageTemplate } from "@/types/index";
import {
  Users,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Check
} from "lucide-react";
import { MessageStatusIndicator } from "./message-status-indicator";

interface BulkMessengerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkMessenger({ isOpen, onClose }: BulkMessengerProps) {
  const { contacts, loading: contactsLoading } = useContacts();
  const { templates } = useMessageTemplates();
  const { sendBulkMessage, loading: sendingLoading } = useMessages();
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactType | "ALL">("ALL");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedContacts([]);
      setMessage("");
      setSelectedTemplate("");
      setTemplateVariables({});
      setSendResults(null);
    }
  }, [isOpen]);

  const filteredContacts = contacts.filter(contact => {
    if (contactTypeFilter !== "ALL" && contact.type !== contactTypeFilter) {
      return false;
    }
    return true;
  });

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.body);
      
      // Initialize template variables
      const vars: Record<string, string> = {};
      template.variables.forEach(variable => {
        vars[variable] = "";
      });
      setTemplateVariables(vars);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || selectedContacts.length === 0) return;

    setIsSending(true);
    try {
      const result = await sendBulkMessage({
        contactIds: selectedContacts,
        body: message.trim(),
        templateId: selectedTemplate || undefined,
        variables: Object.keys(templateVariables).length > 0 ? templateVariables : undefined,
      });
      
      setSendResults(result);
    } catch (error) {
      console.error("Failed to send bulk message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getContactTypeColor = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return "warning";
      case "SALES_REP":
        return "info";
      case "VENDOR":
        return "secondary";
      default:
        return "default";
    }
  };

  const getContactTypeIcon = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return <Users className="h-3 w-3" />;
      case "SALES_REP":
        return <MessageSquare className="h-3 w-3" />;
      case "VENDOR":
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getSmsSegments = (text: string) => {
    if (text.length <= 160) return 1;
    if (text.length <= 306) return 2;
    if (text.length <= 459) return 3;
    return Math.ceil(text.length / 153);
  };

  const segments = getSmsSegments(message);
  const estimatedCost = selectedContacts.length * segments * 0.0075; // Rough estimate

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Message
          </DialogTitle>
        </DialogHeader>

        {sendResults ? (
          // Results View
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {sendResults.success ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <h3 className="text-lg font-semibold">
                  {sendResults.success ? "Messages Sent!" : "Some Messages Failed"}
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sendResults.sent}</div>
                  <div className="text-sm text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{sendResults.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sendResults.sent + sendResults.failed}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>
            </div>

            {/* Detailed Results Table */}
            {sendResults.results && sendResults.results.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Message Delivery Status:</h4>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Contact</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sendResults.results.map((result: any, index: number) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            {result.contact ? `${result.contact.firstName} ${result.contact.lastName}` : "Unknown"}
                          </td>
                          <td className="p-3 text-gray-600">{result.toNumber}</td>
                          <td className="p-3">
                            <MessageStatusIndicator
                              status={result.status}
                              direction={result.direction}
                              showText={true}
                              className="justify-start"
                            />
                          </td>
                          <td className="p-3">
                            {result.status === "FAILED" || result.status === "UNDELIVERED" ? (
                              <span className="text-red-600 text-xs">{result.errorMessage || "Failed"}</span>
                            ) : (
                              <span className="text-gray-500 text-xs">Sent at {new Date(result.createdAt).toLocaleTimeString()}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sendResults.errors && sendResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Failed to Send:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sendResults.errors.map((error: any, index: number) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium">{error.contactName}</div>
                      <div className="text-red-600">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Compose View
          <div className="space-y-6">
            {/* Contact Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Select Recipients</h3>
                <div className="flex items-center gap-2">
                  <Select value={contactTypeFilter} onValueChange={(value) => setContactTypeFilter(value as ContactType | "ALL")}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="CUSTOMER">Customers</SelectItem>
                      <SelectItem value="FIELD_CREW">Field Crew</SelectItem>
                      <SelectItem value="SALES_REP">Sales Reps</SelectItem>
                      <SelectItem value="VENDOR">Vendors</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedContacts.length === filteredContacts.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                {contactsLoading ? (
                  <div className="text-center text-gray-500">Loading contacts...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center text-gray-500">No contacts found</div>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </span>
                            <Badge variant={getContactTypeColor(contact.type)} className="text-xs">
                              {getContactTypeIcon(contact.type)}
                              <span className="ml-1">{contact.type.replace("_", " ")}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.phone} {contact.organization && `• ${contact.organization}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {selectedContacts.length} of {filteredContacts.length} contacts selected
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <h3 className="font-medium mb-2">Message Template (Optional)</h3>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.category}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Composition */}
            <div>
              <h3 className="font-medium mb-2">Message</h3>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[100px]"
              />
              
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <div>
                  {message.length}/1600 characters
                  {segments > 1 && ` • ${segments} SMS${segments > 1 ? "es" : ""}`}
                </div>
                <div>
                  Est. cost: ${estimatedCost.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Template Variables */}
            {selectedTemplate && Object.keys(templateVariables).length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Template Variables</h3>
                <div className="space-y-2">
                  {Object.keys(templateVariables).map((variable) => (
                    <div key={variable} className="flex items-center gap-2">
                      <label className="text-sm font-medium w-24">{variable}:</label>
                      <input
                        type="text"
                        value={templateVariables[variable]}
                        onChange={(e) => setTemplateVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        placeholder={`Enter ${variable}`}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {selectedContacts.length > 50 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Sending to {selectedContacts.length} contacts. This may take a few minutes.
                </span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={!message.trim() || selectedContacts.length === 0 || isSending}
                className="min-w-[120px]"
              >
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedContacts.length}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
