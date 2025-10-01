"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface KeywordDetectionResult {
  keywords: string[];
  department?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  confidence: number;
  matchedRules: Array<{
    id: string;
    keyword: string;
    department: string;
    priority: "low" | "normal" | "high" | "urgent";
    confidence: number;
  }>;
}

interface KeywordRule {
  id: string;
  keyword: string;
  department: string;
  priority: "low" | "normal" | "high" | "urgent";
  confidence: number;
  enabled: boolean;
  description?: string;
}

export function useKeywordDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  // Detect keywords in text
  const detectKeywords = useCallback(async (text: string): Promise<KeywordDetectionResult> => {
    try {
      setIsDetecting(true);
      
      const response = await fetch("/api/taskrouter/keyword-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const result: KeywordDetectionResult = await response.json();
        return result;
      } else {
        throw new Error("Failed to detect keywords");
      }
    } catch (error) {
      console.error("Error detecting keywords:", error);
      toast({
        title: "Detection Error",
        description: "Failed to detect keywords in text",
        variant: "destructive",
      });
      
      // Return empty result on error
      return {
        keywords: [],
        confidence: 0,
        matchedRules: [],
      };
    } finally {
      setIsDetecting(false);
    }
  }, [toast]);

  // Detect keywords with custom rules
  const detectKeywordsWithRules = useCallback(async (
    text: string, 
    rules: KeywordRule[]
  ): Promise<KeywordDetectionResult> => {
    try {
      setIsDetecting(true);
      
      const response = await fetch("/api/taskrouter/keyword-detection/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, rules }),
      });

      if (response.ok) {
        const result: KeywordDetectionResult = await response.json();
        return result;
      } else {
        throw new Error("Failed to detect keywords with custom rules");
      }
    } catch (error) {
      console.error("Error detecting keywords with custom rules:", error);
      toast({
        title: "Detection Error",
        description: "Failed to detect keywords with custom rules",
        variant: "destructive",
      });
      
      // Return empty result on error
      return {
        keywords: [],
        confidence: 0,
        matchedRules: [],
      };
    } finally {
      setIsDetecting(false);
    }
  }, [toast]);

  // Simple keyword detection (client-side fallback)
  const detectKeywordsSimple = useCallback((text: string, rules: KeywordRule[]): KeywordDetectionResult => {
    const lowerText = text.toLowerCase();
    const detectedKeywords: string[] = [];
    const matchedRules: KeywordRule[] = [];
    let department: string | undefined;
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    let totalConfidence = 0;

    // Check each rule
    rules.forEach(rule => {
      if (!rule.enabled) return;

      const keyword = rule.keyword.toLowerCase();
      if (lowerText.includes(keyword)) {
        detectedKeywords.push(rule.keyword);
        matchedRules.push(rule);
        totalConfidence += rule.confidence;

        // Set department and priority based on highest confidence match
        if (!department || rule.confidence > (matchedRules.find(r => r.department === department)?.confidence || 0)) {
          department = rule.department;
        }
        if (rule.priority === "urgent" || (rule.priority === "high" && priority !== "urgent")) {
          priority = rule.priority;
        }
      }
    });

    // Calculate average confidence
    const confidence = matchedRules.length > 0 ? totalConfidence / matchedRules.length : 0;

    return {
      keywords: detectedKeywords,
      department,
      priority,
      confidence,
      matchedRules,
    };
  }, []);

  // Extract keywords using regex patterns
  const extractKeywordsWithRegex = useCallback((text: string, patterns: RegExp[]): string[] => {
    const keywords: string[] = [];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });

    return [...new Set(keywords)]; // Remove duplicates
  }, []);

  // Get keyword suggestions based on text
  const getKeywordSuggestions = useCallback((text: string, existingRules: KeywordRule[]): string[] => {
    const suggestions: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Common keywords that might be useful
    const commonKeywords = [
      "permit", "permits", "permission", "permissions",
      "utility", "utilities", "water", "electric", "gas",
      "emergency", "urgent", "asap", "immediately",
      "schedule", "appointment", "booking", "reservation",
      "billing", "payment", "invoice", "charge",
      "complaint", "issue", "problem", "concern",
      "information", "info", "question", "help",
      "service", "repair", "maintenance", "fix",
    ];

    // Find words that match common keywords but aren't already in rules
    words.forEach(word => {
      if (commonKeywords.includes(word) && !existingRules.some(rule => rule.keyword.toLowerCase() === word)) {
        suggestions.push(word);
      }
    });

    return [...new Set(suggestions)]; // Remove duplicates
  }, []);

  // Analyze text for potential routing decisions
  const analyzeTextForRouting = useCallback(async (text: string): Promise<{
    suggestedDepartment?: string;
    suggestedPriority?: "low" | "normal" | "high" | "urgent";
    confidence: number;
    reasoning: string[];
  }> => {
    const result = await detectKeywords(text);
    const reasoning: string[] = [];

    if (result.keywords.length > 0) {
      reasoning.push(`Detected keywords: ${result.keywords.join(", ")}`);
    }

    if (result.department) {
      reasoning.push(`Suggested department: ${result.department}`);
    }

    if (result.priority && result.priority !== "normal") {
      reasoning.push(`Suggested priority: ${result.priority}`);
    }

    if (result.confidence > 0.8) {
      reasoning.push("High confidence in routing decision");
    } else if (result.confidence > 0.5) {
      reasoning.push("Medium confidence in routing decision");
    } else {
      reasoning.push("Low confidence in routing decision");
    }

    return {
      suggestedDepartment: result.department,
      suggestedPriority: result.priority,
      confidence: result.confidence,
      reasoning,
    };
  }, [detectKeywords]);

  return {
    isDetecting,
    detectKeywords,
    detectKeywordsWithRules,
    detectKeywordsSimple,
    extractKeywordsWithRegex,
    getKeywordSuggestions,
    analyzeTextForRouting,
  };
}
