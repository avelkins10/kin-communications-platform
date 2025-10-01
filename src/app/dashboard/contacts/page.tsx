"use client";

import { useState } from "react";
import { ContactSectionType, CustomerContact, EmployeeContact, ContactConfiguration } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerSection } from "@/components/contacts/customer-section";
import { EmployeeSection } from "@/components/contacts/employee-section";
import { SectionSwitcher } from "@/components/contacts/section-switcher";
import { ContactConfigurationPanel } from "@/components/contacts/contact-configuration-panel";
import { useEnhancedContacts } from "@/lib/hooks/use-enhanced-contacts";
import { useProfessionalInteractions } from "@/lib/hooks/use-professional-interactions";
import { Settings, Users, Building } from "lucide-react";

export default function ContactsPage() {
  const [configurationPanelOpen, setConfigurationPanelOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CustomerContact | EmployeeContact | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);

  const { useButtonState, useNotification } = useProfessionalInteractions();
  const notification = useNotification();

  const {
    customers,
    employees,
    configuration,
    loading,
    error,
    activeSection,
    switchSection,
    refreshData,
    syncCustomerData,
    assignProjectCoordinator,
    updateProjectStatus,
    updateSLAStatus,
    updateConfiguration,
    bulkUpdateStatus,
    bulkAssignPC,
    bulkMarkStale,
    stats
  } = useEnhancedContacts({
    initialSection: 'CUSTOMERS',
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Customer handlers
  const handleCustomerSelect = (customer: CustomerContact) => {
    setSelectedContact(customer);
    setContactFormOpen(true);
  };

  const handleCustomerCall = async (customer: CustomerContact) => {
    try {
      // TODO: Implement call functionality
      notification.showSuccess(`Calling ${customer.firstName} ${customer.lastName}`);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      notification.showError("Failed to initiate call");
    }
  };

  const handleCustomerMessage = async (customer: CustomerContact) => {
    try {
      // TODO: Implement message functionality
      notification.showSuccess(`Messaging ${customer.firstName} ${customer.lastName}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      notification.showError("Failed to send message");
    }
  };

  const handleQuickBaseView = async (customer: CustomerContact) => {
    try {
      // TODO: Open QuickBase view
      notification.showInfo(`Opening QuickBase view for ${customer.firstName} ${customer.lastName}`);
    } catch (error) {
      console.error("Failed to open QuickBase view:", error);
      notification.showError("Failed to open QuickBase view");
    }
  };

  // Employee handlers
  const handleEmployeeSelect = (employee: EmployeeContact) => {
    setSelectedContact(employee);
    setContactFormOpen(true);
  };

  const handleEmployeeCall = async (employee: EmployeeContact) => {
    try {
      // TODO: Implement call functionality
      notification.showSuccess(`Calling ${employee.firstName} ${employee.lastName}`);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      notification.showError("Failed to initiate call");
    }
  };

  const handleEmployeeMessage = async (employee: EmployeeContact) => {
    try {
      // TODO: Implement message functionality
      notification.showSuccess(`Messaging ${employee.firstName} ${employee.lastName}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      notification.showError("Failed to send message");
    }
  };

  const handleEmployeeEdit = (employee: EmployeeContact) => {
    setSelectedContact(employee);
    setContactFormOpen(true);
  };

  const handleEmployeeDelete = async (employee: EmployeeContact) => {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
      try {
        // TODO: Implement delete functionality
        notification.showSuccess(`Deleted ${employee.firstName} ${employee.lastName}`);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete employee:", error);
        notification.showError("Failed to delete employee");
      }
    }
  };

  // Configuration handlers
  const handleConfigurationSave = async (config: ContactConfiguration) => {
    try {
      await updateConfiguration(config);
      setConfigurationPanelOpen(false);
      notification.showSuccess("Configuration updated successfully");
      await refreshData(); // Refresh to apply new configuration
    } catch (error) {
      console.error("Failed to save configuration:", error);
      notification.showError("Failed to save configuration");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Section Switcher */}
      <SectionSwitcher
        activeSection={activeSection}
        onSectionChange={switchSection}
        customerCount={stats.totalCustomers}
        employeeCount={stats.totalEmployees}
        onConfigure={() => setConfigurationPanelOpen(true)}
      />

      {/* Main Content */}
      {activeSection === 'CUSTOMERS' ? (
        <CustomerSection
          onContactSelect={handleCustomerSelect}
          onCall={handleCustomerCall}
          onMessage={handleCustomerMessage}
          onQuickBaseView={handleQuickBaseView}
        />
      ) : (
        <EmployeeSection
          onContactSelect={handleEmployeeSelect}
          onCall={handleEmployeeCall}
          onMessage={handleEmployeeMessage}
          onEdit={handleEmployeeEdit}
          onDelete={handleEmployeeDelete}
        />
      )}

      {/* Configuration Panel Dialog */}
      <Dialog open={configurationPanelOpen} onOpenChange={setConfigurationPanelOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Contact Configuration</span>
            </DialogTitle>
          </DialogHeader>
          <ContactConfigurationPanel
            onClose={() => setConfigurationPanelOpen(false)}
            onSave={handleConfigurationSave}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog */}
      <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600">
              Contact form would be implemented here with proper validation and fields
              based on the contact type (Customer vs Employee).
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setContactFormOpen(false)}
              >
                  Cancel
                </Button>
              <Button onClick={() => setContactFormOpen(false)}>
                Save Contact
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


