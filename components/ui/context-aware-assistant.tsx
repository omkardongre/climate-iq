"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  X,
  Sparkles,
} from "lucide-react";
import { useSimpleVoiceRecording } from "@/hooks/useSimpleVoiceRecording";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { TTSControls } from "@/components/ui/tts-controls";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ContextAwareAssistantProps {
  pageTitle?: string;
  pageContext?: string;
}

export function ContextAwareAssistant({
  pageTitle = "Current Page",
  pageContext = "",
}: ContextAwareAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    isSupported,
  } = useSimpleVoiceRecording();
  const { speak, stop: stopTTS } = useTextToSpeech();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice input
  useEffect(() => {
    if (transcript && isVoiceMode && transcript.trim()) {
      setInputMessage(transcript);
      setIsVoiceMode(false);
      // Auto-submit the voice input without audio feedback
      setTimeout(() => {
        sendMessage(transcript);
      }, 500);
    }
  }, [transcript, isVoiceMode]);

  // Extract page context from DOM
  const extractPageContext = () => {
    const mainContent = document.querySelector("main")?.textContent || "";
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => h.textContent)
      .join(" ");
    const buttons = Array.from(document.querySelectorAll("button"))
      .map((b) => b.textContent)
      .filter(Boolean)
      .join(" ");

    // Extract dynamic values from inputs, sliders, and result displays
    const inputValues = Array.from(
      document.querySelectorAll(
        'input[type="range"], input[type="number"], select'
      )
    )
      .map((input) => {
        const htmlInput = input as HTMLInputElement | HTMLSelectElement;
        const label =
          input.closest("div")?.querySelector("label")?.textContent ||
          input.getAttribute("aria-label") ||
          input.getAttribute("placeholder") ||
          "";
        return `${label}: ${htmlInput.value}${
          input.getAttribute("data-unit") || ""
        }`;
      })
      .filter(Boolean)
      .join(", ");

    // Enhanced result extraction - look for more specific selectors
    const resultDisplays = Array.from(
      document.querySelectorAll(
        '[data-testid*="result"], .result, .score, .impact, .savings, .metric, .value, .amount, .co2, .cost, .energy, .water, .waste, [class*="result"], [class*="metric"], [class*="value"], [id*="result"], [id*="metric"]'
      )
    )
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join(" ");

    // Look for calculated values with expanded selectors
    const calculatedValues = Array.from(
      document.querySelectorAll(
        '[data-value], .calculated, .metric-value, .simulation-result, .impact-value, .savings-value, .chart-value, .timeline-value, [class*="calculated"], [class*="simulation"], [class*="impact"]'
      )
    )
      .map(
        (el) =>
          el.textContent?.trim() ||
          el.getAttribute("data-value") ||
          el.getAttribute("title")
      )
      .filter(Boolean)
      .join(" ");

    // Extract chart and visualization data
    const chartData = Array.from(
      document.querySelectorAll(
        'canvas, svg, .chart, .graph, .visualization, [class*="chart"], [class*="graph"]'
      )
    )
      .map((el) => {
        // Try to get data from aria-label, title, or nearby text
        return (
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          el.closest("div")?.textContent?.slice(0, 200) ||
          ""
        );
      })
      .filter(Boolean)
      .join(" ");

    // Extract form data and state
    const formData = Array.from(document.querySelectorAll("form"))
      .map((form) => {
        const formInputs = Array.from(
          form.querySelectorAll("input, select, textarea")
        )
          .map((input) => {
            const htmlInput = input as
              | HTMLInputElement
              | HTMLSelectElement
              | HTMLTextAreaElement;
            const name =
              htmlInput.name ||
              htmlInput.id ||
              (htmlInput as HTMLInputElement | HTMLTextAreaElement)
                .placeholder ||
              "";
            return `${name}: ${htmlInput.value}`;
          })
          .filter(Boolean)
          .join(", ");
        return formInputs;
      })
      .filter(Boolean)
      .join(" ");

    // Extract any displayed numbers or percentages
    const numericData =
      mainContent
        .match(
          /\d+(?:\.\d+)?[%$€£¥₹]?(?:\s*(?:kg|tons?|years?|days?|months?|CO2|kWh|liters?|gallons?|miles?|km))?/g
        )
        ?.join(" ") || "";

    const projectContext = `OutbackVision AI is an intelligent climate action ecosystem that transforms climate awareness into measurable action through AI-powered tools. The platform includes:
- AI Vision Scanner: Instant environmental impact analysis of objects with carbon footprint calculations
- Real-time Climate Dashboard: Hyper-local environmental data with weather and air quality
- AI Climate Mentor: Conversational guidance for climate questions and actionable advice
- Predictive Action Simulator: AI-powered modeling of environmental impact from lifestyle changes
- Environmental Goals Tracker: Gamified sustainability goal setting with measurable tracking`;

    return `Project Overview: ${projectContext}

Current Page: ${pageTitle}
Page Context: ${pageContext}
Main Content: ${mainContent.slice(0, 800)}
Current Input Values: ${inputValues}
Displayed Results: ${resultDisplays}
Calculated Values: ${calculatedValues}
Chart/Visualization Data: ${chartData}
Form Data: ${formData}
Numeric Data Found: ${numericData}
Page Headings: ${headings}
Available Actions: ${buttons}`.trim();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const pageContext = extractPageContext();
      const contextualPrompt = `You are an AI assistant helping with the current page. Here's the page context:

${pageContext}

User question: ${content}

Please provide a brief, helpful response (2-3 sentences max) based on the current page content. Use markdown formatting with headings (##), bold text (**text**), bullet points (-), and relevant emojis for better readability. Keep responses concise unless the user specifically asks for detailed information.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextualPrompt }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.response || "I apologize, but I couldn't process your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // No auto-speak for voice input - user can manually use TTS if needed
    } catch (error) {
      console.error("Context chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      // Add a small delay to ensure voice feedback is heard
      setTimeout(() => {
        startListening();
      }, 100);
    }
  };

  const clearChat = () => {
    setMessages([]);
    stopTTS();
  };

  const closeAssistant = () => {
    setIsOpen(false);
    clearChat();
    stopTTS();
  };

  return (
    <>
      {/* Floating Assistant Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="relative">
          <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
        </div>
      </Button>

      {/* Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={closeAssistant}>
        <DialogContent
          className="max-w-2xl h-[85vh] flex flex-col p-0"
          showCloseButton={false}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    AI Page Assistant
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">{pageTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-sm"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeAssistant}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-4 max-h-[calc(85vh-200px)]">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about this page! I can help you understand
                    the content, features, and functionality.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <Bot className="h-6 w-6 text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-full p-1" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        {message.role === "assistant" ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            message.role === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === "assistant" && (
                        <TTSControls
                          text={message.content}
                          size="sm"
                          showStatus={false}
                          className="mt-1 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 mt-1">
                      <User className="h-6 w-6 text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-full p-1" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <Bot className="h-6 w-6 text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-1" />
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t px-4 py-3 bg-gray-50 dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about this page..."
                  disabled={isLoading}
                  className="pr-12 text-sm"
                />
                {isSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    className={`absolute right-1 top-1 h-7 w-7 p-0 ${
                      isListening
                        ? "text-red-500 bg-red-50 hover:bg-red-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>

            {isListening && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse text-xs">
                  <Mic className="h-2 w-2 mr-1" />
                  Listening...
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Speak your question
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
