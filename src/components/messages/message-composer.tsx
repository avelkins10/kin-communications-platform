"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMessageTemplates } from "@/lib/hooks/use-messages";
import { MessageTemplate } from "@/types/index";
import { Send, Paperclip, Smile, Clock, AlertCircle, X, Upload, CheckCircle } from "lucide-react";
import { MessageStatusIndicator } from "./message-status-indicator";

interface MessageComposerProps {
  contactId?: string;
  onSendMessage: (message: string, templateId?: string, variables?: Record<string, string>, mediaUrls?: string[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({ 
  contactId, 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..."
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { templates, loading: templatesLoading } = useMessageTemplates();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Calculate SMS segments
  const getSmsSegments = (text: string) => {
    if (text.length <= 160) return 1;
    if (text.length <= 306) return 2;
    if (text.length <= 459) return 3;
    return Math.ceil(text.length / 153);
  };

  const segments = getSmsSegments(message);
  const isOverLimit = message.length > 1600;

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
    if ((!message.trim() && mediaUrls.length === 0) || isSending || disabled) return;

    setIsSending(true);
    setSendSuccess(false);
    setSendError(null);

    try {
      await onSendMessage(
        message.trim(),
        selectedTemplate || undefined,
        Object.keys(templateVariables).length > 0 ? templateVariables : undefined,
        mediaUrls.length > 0 ? mediaUrls : undefined
      );
      setMessage("");
      setSelectedTemplate("");
      setTemplateVariables({});
      setMediaUrls([]);
      setSendSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError(error instanceof Error ? error.message : "Failed to send message");

      // Clear error message after 5 seconds
      setTimeout(() => setSendError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickResponses = [
    "Yes",
    "No", 
    "Thank you",
    "I'll get back to you",
    "Can you call me?",
    "On my way",
    "Running late",
    "See you soon"
  ];

  const insertQuickResponse = (response: string) => {
    setMessage(prev => prev + (prev ? " " : "") + response);
    textareaRef.current?.focus();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} is not supported.`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        return result.mediaUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setMediaUrls(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-t">
      <CardContent className="p-4">
        {/* Template Selection */}
        {!disabled && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={templatesLoading}
              >
                Templates
              </Button>
              {selectedTemplate && (
                <Badge variant="secondary" className="text-xs">
                  Template selected
                </Badge>
              )}
            </div>
            
            {showTemplates && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
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
                
                {selectedTemplate && (
                  <div className="mt-2 text-xs text-gray-600">
                    Template variables: {templates.find(t => t.id === selectedTemplate)?.variables.join(", ") || "None"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Responses */}
        {!disabled && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {quickResponses.map((response) => (
                <Button
                  key={response}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => insertQuickResponse(response)}
                >
                  {response}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isSending}
              className={`min-h-[60px] max-h-[200px] resize-none ${
                isOverLimit ? "border-red-500" : ""
              }`}
            />
            
            {/* Character count and segments */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {message.length}/1600
              {segments > 1 && (
                <span className="ml-1">
                  ({segments} SMS{segments > 1 ? "es" : ""})
                </span>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {sendSuccess && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle className="h-3 w-3" />
              Message sent successfully
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="h-3 w-3" />
              {sendError}
            </div>
          )}

          {/* Warnings */}
          {isOverLimit && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              Message too long (max 1600 characters)
            </div>
          )}

          {segments > 3 && !sendSuccess && !sendError && (
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Clock className="h-3 w-3" />
              Long message - may be split into multiple parts
            </div>
          )}

          {/* Media Attachments */}
          {mediaUrls.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium mb-2">Attachments ({mediaUrls.length}/10):</div>
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white border rounded text-xs">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {url.split('/').pop() || `File ${index + 1}`}
                      </span>
                      <button
                        onClick={() => removeMediaUrl(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isUploading || mediaUrls.length >= 10}
                onClick={() => fileInputRef.current?.click()}
                title={mediaUrls.length >= 10 ? "Maximum 10 attachments" : "Attach files"}
              >
                {isUploading ? (
                  <Upload className="h-4 w-4 animate-pulse" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                title="Emoji picker (coming soon)"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleSend}
              disabled={(!message.trim() && mediaUrls.length === 0) || isSending || disabled || isOverLimit}
              className="min-w-[80px]"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Variables Input */}
        {selectedTemplate && Object.keys(templateVariables).length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Template Variables:</div>
            <div className="space-y-2">
              {Object.keys(templateVariables).map((variable) => (
                <div key={variable} className="flex items-center gap-2">
                  <label className="text-xs font-medium w-20">{variable}:</label>
                  <input
                    type="text"
                    value={templateVariables[variable]}
                    onChange={(e) => setTemplateVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                    placeholder={`Enter ${variable}`}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
