"use client";

import { Contact } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Star } from "lucide-react";

interface QuickDialGridProps {
  contacts: Contact[];
  onCall: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onToggleFavorite: (contact: Contact) => void;
  loading?: boolean;
}

const contactTypeColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  CUSTOMER: "default",
  FIELD_CREW: "info",
  SALES_REP: "success",
  VENDOR: "warning",
};

const contactTypeLabels: Record<string, string> = {
  CUSTOMER: "Customer",
  FIELD_CREW: "Field Crew",
  SALES_REP: "Sales Rep",
  VENDOR: "Vendor",
};

export function QuickDialGrid({
  contacts,
  onCall,
  onSms,
  onToggleFavorite,
  loading = false,
}: QuickDialGridProps) {
  // Filter to show only favorite contacts
  const favoriteContacts = contacts.filter(contact => contact.isFavorite);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (favoriteContacts.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Favorite Contacts
        </h3>
        <p className="text-sm text-muted-foreground">
          Mark contacts as favorites to see them in your quick dial grid.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {favoriteContacts.map((contact) => (
        <Card key={contact.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">
                  {contact.firstName} {contact.lastName}
                </CardTitle>
                {contact.organization && (
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.organization}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(contact)}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="font-mono text-sm text-muted-foreground">
                {contact.phone}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={contactTypeColors[contact.type]} className="text-xs">
                  {contactTypeLabels[contact.type]}
                </Badge>
                {contact.department && (
                  <span className="text-xs text-muted-foreground">
                    {contact.department}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onCall(contact)}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSms(contact)}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
