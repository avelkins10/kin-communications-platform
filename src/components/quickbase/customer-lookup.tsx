"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, Phone, Mail, User, CheckCircle } from "lucide-react";
import { QBCustomer, QBProjectCoordinator } from "@/types/quickbase";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface CustomerLookupProps {
  onCustomerSelect?: (customer: QBCustomer, projectCoordinator?: QBProjectCoordinator) => void;
  placeholder?: string;
  className?: string;
}

interface CustomerSearchResult {
  customer: QBCustomer;
  projectCoordinator?: QBProjectCoordinator;
  found: boolean;
}

export function CustomerLookup({ onCustomerSelect, placeholder = "Search by phone number...", className }: CustomerLookupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CustomerSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<QBCustomer | null>(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const searchCustomer = useCallback(async (phone: string) => {
    if (!phone || phone.length < 10) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quickbase/customers?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search customer");
      }

      if (data.success) {
        setResults(data.data);
      } else {
        setResults({ found: false, customer: {} as QBCustomer });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search customer");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchCustomer(debouncedSearchTerm);
    } else {
      setResults(null);
    }
  }, [debouncedSearchTerm, searchCustomer]);

  const handleCustomerSelect = (customer: QBCustomer, projectCoordinator?: QBProjectCoordinator) => {
    setSelectedCustomer(customer);
    onCustomerSelect?.(customer, projectCoordinator);
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setResults(null);
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (selectedCustomer) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Selected Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {formatPhoneNumber(selectedCustomer.phone)}
            </div>
            {selectedCustomer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {selectedCustomer.email}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="default">Customer ID: {selectedCustomer.id}</Badge>
            {selectedCustomer.projectStatus && (
              <Badge variant="secondary">{selectedCustomer.projectStatus}</Badge>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={clearSelection} className="w-full">
            Clear Selection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Customer Lookup
        </CardTitle>
        <CardDescription>
          Search for customers by phone number
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Search Results */}
        {results && !loading && (
          <div className="space-y-3">
            {results.found && results.customer ? (
              <div className="border rounded-md p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{results.customer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {formatPhoneNumber(results.customer.phone)}
                  </div>
                  {results.customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {results.customer.email}
                    </div>
                  )}
                </div>

                {/* Project Coordinator Info */}
                {results.projectCoordinator && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-sm">Project Coordinator</span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{results.projectCoordinator.name}</div>
                      <div className="text-muted-foreground">{results.projectCoordinator.email}</div>
                      <Badge variant="secondary" className="mt-1">
                        {results.projectCoordinator.availability}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline">ID: {results.customer.id}</Badge>
                  {results.customer.projectStatus && (
                    <Badge variant="secondary">{results.customer.projectStatus}</Badge>
                  )}
                </div>

                {/* Select Button */}
                <Button 
                  onClick={() => handleCustomerSelect(results.customer, results.projectCoordinator)}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Select Customer
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customer found with that phone number</p>
                <p className="text-sm">Try a different phone number or check the format</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        {!searchTerm && !loading && !results && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Enter a phone number to search for customers</p>
            <p>• Include area code (e.g., 555-123-4567)</p>
            <p>• International numbers supported</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
