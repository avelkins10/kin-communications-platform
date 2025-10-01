"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMessageTemplates } from "@/lib/hooks/use-messages";
import { MessageTemplate, TemplateCategory } from "@/types/index";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  Filter,
  MessageSquare,
  Users,
  Phone,
  Calendar,
  Wrench
} from "lucide-react";

export function MessageTemplates() {
  const { 
    templates, 
    loading, 
    error, 
    searchTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useMessageTemplates();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "ALL">("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    body: "",
    category: "GENERAL" as TemplateCategory,
    variables: [] as string[],
    isShared: false,
  });

  const handleSearch = () => {
    searchTemplates({
      search: search || undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    });
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate(formData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate(editingTemplate.id, formData);
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  };

  const handleDeleteTemplate = async (template: MessageTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      body: template.body,
      category: template.category,
      variables: template.variables,
      isShared: template.isShared,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      body: "",
      category: "GENERAL",
      variables: [],
      isShared: false,
    });
  };

  const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
      case "SUPPORT":
        return <MessageSquare className="h-4 w-4" />;
      case "SALES":
        return <Phone className="h-4 w-4" />;
      case "SCHEDULING":
        return <Calendar className="h-4 w-4" />;
      case "FIELD_CREW":
        return <Users className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case "SUPPORT":
        return "info";
      case "SALES":
        return "success";
      case "SCHEDULING":
        return "warning";
      case "FIELD_CREW":
        return "secondary";
      default:
        return "default";
    }
  };

  const extractVariables = (text: string) => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleBodyChange = (body: string) => {
    setFormData(prev => ({
      ...prev,
      body,
      variables: extractVariables(body),
    }));
  };

  const commonTemplates = [
    {
      name: "Welcome Message",
      body: "Hi {firstName}, welcome to our service! We're excited to work with you.",
      category: "SUPPORT" as TemplateCategory,
    },
    {
      name: "Appointment Confirmation",
      body: "Hi {firstName}, your appointment is confirmed for {date} at {time}. Please arrive 15 minutes early.",
      category: "SCHEDULING" as TemplateCategory,
    },
    {
      name: "Follow Up",
      body: "Hi {firstName}, I wanted to follow up on our conversation. Do you have any questions?",
      category: "SALES" as TemplateCategory,
    },
    {
      name: "Field Crew Update",
      body: "Hi {firstName}, the field crew is on their way to {location}. ETA: {time}.",
      category: "FIELD_CREW" as TemplateCategory,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Templates
          </CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as TemplateCategory | "ALL")}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="SCHEDULING">Scheduling</SelectItem>
                <SelectItem value="FIELD_CREW">Field Crew</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-center text-red-500 mb-4">
            <p>Error loading templates: {error}</p>
          </div>
        )}

        {/* Common Templates */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Quick Add Common Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commonTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start h-auto p-3"
                onClick={() => {
                  setFormData({
                    name: template.name,
                    body: template.body,
                    category: template.category,
                    variables: extractVariables(template.body),
                    isShared: false,
                  });
                  setIsCreateDialogOpen(true);
                }}
              >
                <div className="text-left">
                  <div className="font-medium text-xs">{template.name}</div>
                  <div className="text-xs text-gray-500 truncate">{template.body}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates found</p>
            <p className="text-sm">Create your first template to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={getCategoryColor(template.category)} className="text-xs">
                        {getCategoryIcon(template.category)}
                        <span className="ml-1">{template.category}</span>
                      </Badge>
                      {template.isShared && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {template.usageCount} uses
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{template.body}</p>
                    
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Variables:</span>
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{${variable}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(template.body)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TemplateCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="SCHEDULING">Scheduling</SelectItem>
                  <SelectItem value="FIELD_CREW">Field Crew</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Message Body</label>
              <Textarea
                value={formData.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Enter your message template. Use {variableName} for variables."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use curly braces for variables: {`{firstName}`, `{lastName}`, `{company}`}
              </p>
            </div>
            
            {formData.variables.length > 0 && (
              <div>
                <label className="text-sm font-medium">Detected Variables</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isShared"
                checked={formData.isShared}
                onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isShared" className="text-sm">
                Share this template with other users
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!formData.name || !formData.body}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Message Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TemplateCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="SCHEDULING">Scheduling</SelectItem>
                  <SelectItem value="FIELD_CREW">Field Crew</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Message Body</label>
              <Textarea
                value={formData.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Enter your message template. Use {variableName} for variables."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use curly braces for variables: {`{firstName}`, `{lastName}`, `{company}`}
              </p>
            </div>
            
            {formData.variables.length > 0 && (
              <div>
                <label className="text-sm font-medium">Detected Variables</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSharedEdit"
                checked={formData.isShared}
                onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isSharedEdit" className="text-sm">
                Share this template with other users
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={!formData.name || !formData.body}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
