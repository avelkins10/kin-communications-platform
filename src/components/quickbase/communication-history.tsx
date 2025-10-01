"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Phone, Mail, MessageSquare, Play, Download, Filter, Search } from "lucide-react";
import { QBCommunication } from "@/types/quickbase";

interface CommunicationHistoryProps {
  customerId: string;
  className?: string;
}

interface CommunicationRecord extends QBCommunication {
  id: string;
  timestamp: string;
  duration?: number;
  agentId?: string;
  notes?: string;
  recordingUrl?: string;
  status: string;
}

export function CommunicationHistory({ customerId, className }: CommunicationHistoryProps) {
  const [communications, setCommunications] = useState<CommunicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (customerId) {
      fetchCommunicationHistory();
    }
  }, [customerId]);

  const fetchCommunicationHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement real API endpoint /api/quickbase/communications?customerId=...
      // For now, using mock data for demonstration purposes
      const mockCommunications: CommunicationRecord[] = [
        {
          id: "1",
          customerId,
          type: "call",
          direction: "inbound",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 180,
          agentId: "agent1",
          status: "completed",
          recordingUrl: "https://example.com/recording1.mp3"
        },
        {
          id: "2",
          customerId,
          type: "sms",
          direction: "outbound",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          agentId: "agent1",
          status: "completed"
        },
        {
          id: "3",
          customerId,
          type: "call",
          direction: "outbound",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          duration: 0,
          agentId: "agent2",
          status: "missed"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommunications(mockCommunications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load communication history");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "voicemail":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call":
        return "default";
      case "sms":
        return "secondary";
      case "voicemail":
        return "outline";
      case "email":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "missed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === "inbound" ? "default" : "secondary";
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = !searchTerm || 
      comm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || comm.type === typeFilter;
    const matchesStatus = statusFilter === "all" || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCommunicationHistory}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communication History
          <Badge variant="secondary" className="text-xs">Demo</Badge>
        </CardTitle>
        <CardDescription>
          All logged communications for this customer (using demo data)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="call">Calls</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="voicemail">Voicemail</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Communications Table */}
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No communications found</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommunications.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.type)}
                        <Badge variant={getTypeColor(comm.type)}>
                          {comm.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDirectionColor(comm.direction)}>
                        {comm.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(comm.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatDuration(comm.duration)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(comm.status)}>
                        {comm.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {comm.agentId || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {comm.recordingUrl && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Export Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredCommunications.length} communication{filteredCommunications.length !== 1 ? 's' : ''} found
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
