"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isInitialized) {
      const initialMessage: Message = {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm your Climate Assistant. I can help you with climate action in rural areas, wildfire prep, drought management, and sustainable rural living. What can I help you with today?",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const trackChatTopic = async (
    userMessage: string,
    assistantResponse: string
  ) => {
    try {
      // Extract topic from the conversation
      const topic = extractTopicFromMessage(userMessage);
      if (topic) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await fetch("/api/chat-topics", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            user_message: userMessage,
            assistant_response: assistantResponse,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to track chat topic:", error);
    }
  };

  const extractTopicFromMessage = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();

    // Simple topic extraction based on keywords
    if (
      lowerMessage.includes("transport") ||
      lowerMessage.includes("car") ||
      lowerMessage.includes("bike") ||
      lowerMessage.includes("commute")
    ) {
      return "transport";
    }
    if (
      lowerMessage.includes("energy") ||
      lowerMessage.includes("electricity") ||
      lowerMessage.includes("solar") ||
      lowerMessage.includes("renewable")
    ) {
      return "energy";
    }
    if (
      lowerMessage.includes("food") ||
      lowerMessage.includes("diet") ||
      lowerMessage.includes("plant") ||
      lowerMessage.includes("meat")
    ) {
      return "food";
    }
    if (
      lowerMessage.includes("waste") ||
      lowerMessage.includes("recycle") ||
      lowerMessage.includes("plastic") ||
      lowerMessage.includes("packaging")
    ) {
      return "waste";
    }
    if (
      lowerMessage.includes("water") ||
      lowerMessage.includes("conservation") ||
      lowerMessage.includes("shower")
    ) {
      return "water";
    }

    return "general"; // Default topic
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get selected location from browser storage
      const selectedLocationObj = localStorage.getItem("climateIQ-location");
      const selectedCountry = selectedLocationObj
        ? JSON.parse(selectedLocationObj).name
        : "USA";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          selectedCountry: selectedCountry,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.content ||
          "I'm sorry, I couldn't process your request right now.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Track the chat topic for personalization
      await trackChatTopic(message.trim(), assistantMessage.content);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-900 rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-green-50 dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Outback Climate Mate
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Your fair dinkum guide to outback climate action
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 break-words ${
                    message.role === "user"
                      ? "bg-green-500 text-white ml-8"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === "assistant" && (
                      <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full flex-shrink-0">
                        <Bot className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {message.content.replace(/\*/g, "")}
                      </div>
                      <div className="text-xs opacity-60 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="p-1.5 bg-white/20 rounded-full flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 mr-8">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full">
                      <Bot className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about outback climate, bushfires, drought, or rural sustainability..."
              disabled={isLoading}
              className="pr-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-900"
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
