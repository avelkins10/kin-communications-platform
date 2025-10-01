"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  TestTube, 
  MessageSquare,
  Phone,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface KeywordRule {
  id: string;
  keyword: string;
  department: string;
  priority: "low" | "normal" | "high" | "urgent";
  confidence: number;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface KeywordDetectionResult {
  keywords: string[];
  department?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  confidence: number;
  matchedRules: KeywordRule[];
}

interface KeywordDetectionProps {
  onTestDetection: (text: string) => Promise<KeywordDetectionResult>;
}

export function KeywordDetection({ onTestDetection }: KeywordDetectionProps) {
  const [keywordRules, setKeywordRules] = useState<KeywordRule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<KeywordRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<KeywordDetectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockRules: KeywordRule[] = [
      {
        id: "1",
        keyword: "permit",
        department: "Permitting",
        priority: "high",
        confidence: 0.8,
        enabled: true,
        description: "Detects permit-related inquiries",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        keyword: "utility",
        department: "Utilities",
        priority: "normal",
        confidence: 0.7,
        enabled: true,
        description: "Detects utility-related inquiries",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        keyword: "emergency",
        department: "Emergency Services",
        priority: "urgent",
        confidence: 0.9,
        enabled: true,
        description: "Detects emergency situations",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        keyword: "schedule",
        department: "Scheduling",
        priority: "normal",
        confidence: 0.6,
        enabled: true,
        description: "Detects scheduling requests",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "5",
        keyword: "billing",
        department: "Billing",
        priority: "normal",
        confidence: 0.7,
        enabled: false,
        description: "Detects billing inquiries",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setKeywordRules(mockRules);
  }, []);

  const filteredRules = keywordRules.filter(rule => {
    const matchesSearch = rule.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || rule.department === filterDepartment;
    const matchesPriority = filterPriority === "all" || rule.priority === filterPriority;
    
    return matchesSearch && matchesDepartment && matchesPriority;
  });

  const departments = Array.from(new Set(keywordRules.map(rule => rule.department)));
  const priorities = ["low", "normal", "high", "urgent"];

  const handleAddRule = () => {
    setEditingRule({
      id: "",
      keyword: "",
      department: "",
      priority: "normal",
      confidence: 0.7,
      enabled: true,
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: KeywordRule) => {
    setEditingRule({ ...rule });
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    if (!editingRule.keyword.trim()) {
      toast({
        title: "Validation Error",
        description: "Keyword is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingRule.department.trim()) {
      toast({
        title: "Validation Error",
        description: "Department is required",
        variant: "destructive",
      });
      return;
    }

    const isNewRule = !editingRule.id;
    const updatedRule = {
      ...editingRule,
      id: isNewRule ? Date.now().toString() : editingRule.id,
      updatedAt: new Date().toISOString(),
    };

    if (isNewRule) {
      setKeywordRules([...keywordRules, updatedRule]);
      toast({
        title: "Rule Added",
        description: "Keyword rule has been added successfully",
      });
    } else {
      setKeywordRules(keywordRules.map(rule => 
        rule.id === editingRule.id ? updatedRule : rule
      ));
      toast({
        title: "Rule Updated",
        description: "Keyword rule has been updated successfully",
      });
    }

    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    setKeywordRules(keywordRules.filter(rule => rule.id !== ruleId));
    toast({
      title: "Rule Deleted",
      description: "Keyword rule has been deleted",
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setKeywordRules(keywordRules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleTestDetection = async () => {
    if (!testText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter text to test",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await onTestDetection(testText);
      setTestResult(result);
      toast({
        title: "Test Complete",
        description: `Detected ${result.keywords.length} keywords with ${Math.round(result.confidence * 100)}% confidence`,
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test keyword detection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "normal":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Keyword Detection</h2>
          <p className="text-muted-foreground">
            Configure and test keyword detection rules for intelligent routing
          </p>
        </div>
        <Button onClick={handleAddRule}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Keyword Detection</span>
          </CardTitle>
          <CardDescription>
            Test how keyword detection works with sample text
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testText">Sample Text</Label>
              <Textarea
                id="testText"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test keyword detection (e.g., 'I need help with my permit application')"
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleTestDetection} disabled={isTesting}>
              {isTesting ? (
                <>
                  <TestTube className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Detection
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-3">Detection Results</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Detected Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {testResult.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confidence</Label>
                  <div className={`text-lg font-bold ${getConfidenceColor(testResult.confidence)}`}>
                    {Math.round(testResult.confidence * 100)}%
                  </div>
                </div>
                {testResult.department && (
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <Badge className="mt-1">{testResult.department}</Badge>
                  </div>
                )}
                {testResult.priority && (
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge className={`mt-1 ${getPriorityColor(testResult.priority)}`}>
                      {testResult.priority.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
              {testResult.matchedRules.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Matched Rules</Label>
                  <div className="space-y-2 mt-1">
                    {testResult.matchedRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div>
                          <span className="font-medium">{rule.keyword}</span>
                          <span className="text-sm text-muted-foreground ml-2">→ {rule.department}</span>
                        </div>
                        <Badge className={getPriorityColor(rule.priority)}>
                          {rule.priority.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search keyword rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {filteredRules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{rule.keyword}</CardTitle>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge className={getPriorityColor(rule.priority)}>
                    {rule.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                  >
                    {rule.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {rule.description && (
                <CardDescription>{rule.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                  <p className="text-sm">{rule.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Confidence</Label>
                  <p className={`text-sm font-medium ${getConfidenceColor(rule.confidence)}`}>
                    {Math.round(rule.confidence * 100)}%
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{new Date(rule.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule?.id ? "Edit Keyword Rule" : "Add Keyword Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure a keyword detection rule for intelligent routing
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  value={editingRule.keyword}
                  onChange={(e) => setEditingRule({ ...editingRule, keyword: e.target.value })}
                  placeholder="Enter keyword to detect"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={editingRule.department}
                  onValueChange={(value) => setEditingRule({ ...editingRule, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editingRule.priority}
                  onValueChange={(value) => setEditingRule({ ...editingRule, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="confidence">Confidence (0.0 - 1.0)</Label>
                <Input
                  id="confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editingRule.confidence}
                  onChange={(e) => setEditingRule({ ...editingRule, confidence: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRule.description || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Enter rule description"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule}>
                  Save Rule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
