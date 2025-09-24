"use client";

import { useState } from "react";
import { Contact, ContactType } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, MessageSquare, Edit, Trash2, Star } from "lucide-react";

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onCall: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onToggleFavorite: (contact: Contact) => void;
  loading?: boolean;
}

const contactTypeColors: Record<ContactType, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  CUSTOMER: "default",
  FIELD_CREW: "info",
  SALES_REP: "success",
  VENDOR: "warning",
};

const contactTypeLabels: Record<ContactType, string> = {
  CUSTOMER: "Customer",
  FIELD_CREW: "Field Crew",
  SALES_REP: "Sales Rep",
  VENDOR: "Vendor",
};

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
  onCall,
  onSms,
  onToggleFavorite,
  loading = false,
}: ContactsTableProps) {
  const [sortField, setSortField] = useState<keyof Contact>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === "asc" 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    return 0;
  });

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No contacts found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("firstName")}
            >
              Name
              {sortField === "firstName" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("phone")}
            >
              Phone
              {sortField === "phone" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("email")}
            >
              Email
              {sortField === "email" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("type")}
            >
              Type
              {sortField === "type" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("department")}
            >
              Department
              {sortField === "department" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleFavorite(contact)}
                    className="h-6 w-6 p-0"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        contact.isFavorite 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-400"
                      }`} 
                    />
                  </Button>
                </div>
                {contact.organization && (
                  <div className="text-sm text-muted-foreground">
                    {contact.organization}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">{contact.phone}</div>
              </TableCell>
              <TableCell>
                {contact.email ? (
                  <div className="text-sm">{contact.email}</div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={contactTypeColors[contact.type]}>
                  {contactTypeLabels[contact.type]}
                </Badge>
              </TableCell>
              <TableCell>
                {contact.department ? (
                  <div className="text-sm">{contact.department}</div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCall(contact)}
                    className="h-8 w-8 p-0"
                    title="Call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSms(contact)}
                    className="h-8 w-8 p-0"
                    title="Send SMS"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(contact)}
                    className="h-8 w-8 p-0"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(contact)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
