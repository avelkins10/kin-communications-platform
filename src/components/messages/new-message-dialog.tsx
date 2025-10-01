"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/lib/hooks/use-contacts";
import { Contact, ContactType } from "@/types/index";
import {
  Search,
  User,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Plus
} from "lucide-react";

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contactId: string) => void;
}

export function NewMessageDialog({
  isOpen,
  onClose,
  onSelectContact,
}: NewMessageDialogProps) {
  const { contacts, loading, searchContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  // Load recent contacts (contacts with recent messages)
  useEffect(() => {
    if (isOpen) {
      // Get all contacts initially
      searchContacts({});
    }
  }, [isOpen, searchContacts]);

  // Filter contacts based on search
  useEffect(() => {
    if (searchQuery) {
      searchContacts({
        search: searchQuery,
        limit: 50,
      });
    }
  }, [searchQuery, searchContacts]);

  // Get recent contacts (simplified - you might want to sort by last message time)
  useEffect(() => {
    if (contacts.length > 0 && !searchQuery) {
      setRecentContacts(contacts.slice(0, 5));
    }
  }, [contacts, searchQuery]);

  const handleSelectContact = (contactId: string) => {
    onSelectContact(contactId);
    onClose();
    setSearchQuery("");
  };

  const getContactTypeIcon = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return <Users className="h-4 w-4" />;
      case "SALES_REP":
        return <Phone className="h-4 w-4" />;
      case "VENDOR":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getContactTypeColor = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "SALES_REP":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "VENDOR":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const displayedContacts = searchQuery ? contacts : recentContacts;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contacts by name, phone, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {searchQuery ? `Search Results (${contacts.length})` : "Recent Contacts"}
            </h3>
            {!searchQuery && recentContacts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery(" ")}
                className="text-xs"
              >
                View All
              </Button>
            )}
          </div>

          {/* Contacts List */}
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {loading ? (
              <div className="py-8 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                <p className="text-sm text-gray-500">Loading contacts...</p>
              </div>
            ) : displayedContacts.length === 0 ? (
              <div className="py-8 text-center">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {searchQuery ? "No contacts found" : "No recent contacts"}
                </p>
                <p className="text-xs text-gray-500">
                  {searchQuery
                    ? "Try a different search term"
                    : "Start a conversation to see recent contacts"}
                </p>
              </div>
            ) : (
              displayedContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getContactTypeColor(
                        contact.type
                      )}`}
                    >
                      {getContactTypeIcon(contact.type)}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getContactTypeColor(contact.type)}`}
                        >
                          {contact.type.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phone}</span>
                        {contact.organization && (
                          <>
                            <span>•</span>
                            <span className="truncate">{contact.organization}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Contact Option */}
          {searchQuery && !loading && contacts.length === 0 && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  // TODO: Open create contact dialog
                  console.log("Create new contact with:", searchQuery);
                }}
              >
                <Plus className="h-4 w-4" />
                Create new contact "{searchQuery}"
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}