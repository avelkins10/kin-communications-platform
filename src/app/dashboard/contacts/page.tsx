"use client";

import { useState } from "react";
import { Contact, ContactCreateInput, ContactUpdateInput, ContactSearchParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactForm } from "@/components/contacts/contact-form";
import { QuickDialGrid } from "@/components/contacts/quick-dial-grid";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ContactImporter } from "@/components/contacts/contact-importer";
import { ContactGroupsManager } from "@/components/contacts/contact-groups-manager";
import { useContacts, useContactGroups } from "@/lib/hooks/use-contacts";
import { Plus, Upload, Users, Phone } from "lucide-react";

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<ContactSearchParams>({});
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsContact, setSmsContact] = useState<Contact | null>(null);
  const [smsMessage, setSmsMessage] = useState("");

  const {
    contacts,
    groups,
    loading,
    error,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    callContact,
    sendSms,
    importContacts,
  } = useContacts();

  const {
    groups: allGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useContactGroups();

  const handleSearch = (params: ContactSearchParams) => {
    setSearchParams(params);
    searchContacts(params);
  };

  const handleCreateContact = async (data: ContactCreateInput) => {
    try {
      await createContact(data);
      setContactFormOpen(false);
      // Refresh search with current params
      searchContacts(searchParams);
    } catch (error) {
      console.error("Failed to create contact:", error);
    }
  };

  const handleUpdateContact = async (data: ContactUpdateInput) => {
    if (!selectedContact) return;
    
    try {
      await updateContact(selectedContact.id, data);
      setContactFormOpen(false);
      setSelectedContact(null);
      // Refresh search with current params
      searchContacts(searchParams);
    } catch (error) {
      console.error("Failed to update contact:", error);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`)) {
      try {
        await deleteContact(contact.id);
        // Refresh search with current params
        searchContacts(searchParams);
      } catch (error) {
        console.error("Failed to delete contact:", error);
      }
    }
  };

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      await toggleFavorite(contact.id);
      // Refresh search with current params
      searchContacts(searchParams);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleCallContact = async (contact: Contact) => {
    try {
      await callContact(contact.id);
      // TODO: Show success message or handle call UI
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  const handleSmsContact = (contact: Contact) => {
    setSmsContact(contact);
    setSmsMessage("");
    setSmsDialogOpen(true);
  };

  const handleSendSms = async () => {
    if (!smsContact || !smsMessage.trim()) return;
    
    try {
      await sendSms(smsContact.id, smsMessage);
      setSmsDialogOpen(false);
      setSmsContact(null);
      setSmsMessage("");
      // TODO: Show success message
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }
  };

  const handleImportContacts = async (file: File) => {
    try {
      const result = await importContacts(file);
      // Refresh search with current params
      searchContacts(searchParams);
      return result;
    } catch (error) {
      console.error("Failed to import contacts:", error);
      throw error;
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactFormOpen(true);
  };

  const handleCreateNewContact = () => {
    setSelectedContact(null);
    setContactFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and communication history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImporterOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleCreateNewContact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Contacts
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Quick Dial
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactSearch
                onSearch={handleSearch}
                groups={allGroups}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Contacts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsTable
                contacts={contacts}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onCall={handleCallContact}
                onSms={handleSmsContact}
                onToggleFavorite={handleToggleFavorite}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Dial - Favorite Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickDialGrid
                contacts={contacts}
                onCall={handleCallContact}
                onSms={handleSmsContact}
                onToggleFavorite={handleToggleFavorite}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactGroupsManager
                groups={allGroups}
                onCreateGroup={createGroup}
                onUpdateGroup={updateGroup}
                onDeleteGroup={deleteGroup}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Form Dialog */}
      <ContactForm
        contact={selectedContact}
        groups={allGroups}
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
        loading={loading}
      />

      {/* CSV Import Dialog */}
      <ContactImporter
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImport={handleImportContacts}
        loading={loading}
      />

      {/* SMS Dialog */}
      {smsContact && (
        <div className={`fixed inset-0 z-50 ${smsDialogOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSmsDialogOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Send SMS to {smsContact.firstName} {smsContact.lastName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Type your message here..."
                  maxLength={1600}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {smsMessage.length}/1600 characters
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendSms} 
                  disabled={!smsMessage.trim() || loading}
                >
                  {loading ? "Sending..." : "Send SMS"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


