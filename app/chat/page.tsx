"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { TTSControls } from "@/components/ui/tts-controls";
import { renderMarkdownText } from "@/lib/markdown-utils";
import { getLocationForChat } from "@/lib/location-storage";
import { AuthGuard } from "@/components/ui/auth-guard";
import { FloatingButtons } from "@/components/ui/floating-buttons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      loadLocalConversations();
    }
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Local storage helpers
  const getLocalConversations = (): Conversation[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("climateIQ-conversations");
    return stored ? JSON.parse(stored) : [];
  };

  const setLocalConversations = (conversations: Conversation[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "climateIQ-conversations",
      JSON.stringify(conversations)
    );
  };

  const getLocalMessages = (conversationId: string): Message[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`climateIQ-messages-${conversationId}`);
    return stored
      ? JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      : [];
  };

  const setLocalMessages = (conversationId: string, messages: Message[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      `climateIQ-messages-${conversationId}`,
      JSON.stringify(messages)
    );
  };

  const loadLocalConversations = () => {
    const localConversations = getLocalConversations();
    setConversations(localConversations);

    // If no current conversation and conversations exist, select the first one
    if (!currentConversation && localConversations.length > 0) {
      setCurrentConversation(localConversations[0]);
    }
    setLoadingConversations(false);
  };

  const loadConversations = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/conversations", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);

        // If no current conversation and conversations exist, select the first one
        if (!currentConversation && data.conversations.length > 0) {
          setCurrentConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (user) {
      // Load from database for authenticated users
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `/api/messages?conversation_id=${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    } else {
      // Load from localStorage for non-authenticated users
      const localMessages = getLocalMessages(conversationId);
      setMessages(localMessages);
    }
  };

  const createNewConversation = async () => {
    try {
      if (user) {
        // Create in database for authenticated users
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newConversationTitle || "New Conversation",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await loadConversations();
          setCurrentConversation(data.conversation);
          setNewConversationTitle("");
          setShowNewConversationDialog(false);
        }
      } else {
        // Create in localStorage for non-authenticated users
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: newConversationTitle || "New Conversation",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const currentConversations = getLocalConversations();
        const updatedConversations = [newConversation, ...currentConversations];
        setLocalConversations(updatedConversations);
        setConversations(updatedConversations);
        setCurrentConversation(newConversation);
        setNewConversationTitle("");
        setShowNewConversationDialog(false);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!currentConversation) return;

    try {
      if (user) {
        // Save to database for authenticated users
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        await fetch("/api/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: currentConversation.id,
            role,
            content,
          }),
        });
      } else {
        // Save to localStorage for non-authenticated users
        const currentMessages = getLocalMessages(currentConversation.id);
        const newMessage: Message = {
          id: Date.now().toString() + Math.random(),
          role,
          content,
          timestamp: new Date(),
        };
        const updatedMessages = [...currentMessages, newMessage];
        setLocalMessages(currentConversation.id, updatedMessages);

        // Update conversation timestamp
        const conversations = getLocalConversations();
        const updatedConversations = conversations.map((conv) =>
          conv.id === currentConversation.id
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        );
        setLocalConversations(updatedConversations);
        setConversations(updatedConversations);
      }
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      if (user) {
        // Delete from database for authenticated users
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `/api/conversations?id=${conversationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          await loadConversations();
          if (currentConversation?.id === conversationId) {
            setCurrentConversation(null);
            setMessages([]);
          }
        }
      } else {
        // Delete from localStorage for non-authenticated users
        const conversations = getLocalConversations();
        const updatedConversations = conversations.filter(
          (conv) => conv.id !== conversationId
        );
        setLocalConversations(updatedConversations);
        setConversations(updatedConversations);

        // Remove messages for this conversation
        localStorage.removeItem(`climateIQ-messages-${conversationId}`);

        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // If no current conversation, create one first
    if (!currentConversation) {
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title:
              inputMessage.slice(0, 50) +
              (inputMessage.length > 50 ? "..." : ""),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentConversation(data.conversation);
          await loadConversations();
        }
      } else {
        // Create new conversation in localStorage
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title:
            inputMessage.slice(0, 50) + (inputMessage.length > 50 ? "..." : ""),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const currentConversations = getLocalConversations();
        const updatedConversations = [newConversation, ...currentConversations];
        setLocalConversations(updatedConversations);
        setConversations(updatedConversations);
        setCurrentConversation(newConversation);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage("user", inputMessage);
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
          message: inputMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          location: getLocationForChat(),
          selectedCountry: selectedCountry,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Ensure we have a valid response
      const responseContent =
        data.response ||
        data.content ||
        "I apologize, but I couldn't generate a response.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage("assistant", responseContent);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        const formEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        }) as any;
        handleSendMessage(formEvent);
      }
    }
  };

  const handleUpdateTitle = async (conversationId: string) => {
    if (user) {
      // Update in database for authenticated users
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTitle,
        }),
      });

      if (response.ok) {
        await loadConversations();
        setEditingConversationId(null);
        setEditingTitle("");
      }
    } else {
      // Update in localStorage for non-authenticated users
      const conversations = getLocalConversations();
      const updatedConversations = conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, title: editingTitle } : conv
      );
      setLocalConversations(updatedConversations);
      setConversations(updatedConversations);
      setEditingConversationId(null);
      setEditingTitle("");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100 dark:from-sky-950 dark:via-cyan-950 dark:to-blue-950">
      <AuthGuard>
        {/* Floating Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/10 dark:bg-gray-900/10 backdrop-blur-2xl border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-gradient-to-r from-sky-500 to-cyan-600 rounded-2xl shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Climate Assistant
              </h1>
            </div>
          </div>
        </div>

        <div className="flex h-screen pt-16">
          {/* Enhanced Sidebar */}
          <div className="w-80 bg-gradient-to-b from-white/40 to-sky-50/40 dark:from-gray-800/40 dark:to-sky-900/40 backdrop-blur-2xl border-r border-white/20 flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/30 dark:border-gray-700/30">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-100 to-cyan-100 dark:from-sky-900/50 dark:to-cyan-900/50 px-3 py-1.5 rounded-full mb-3">
                  <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                    Powered by AI
                  </span>
                </div>
              </div>
              <Button
                onClick={createNewConversation}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl py-6 text-base font-semibold"
              >
                <Plus className="h-5 w-5 mr-3" />
                Start New Chat
              </Button>
            </div>

            {/* Enhanced Conversations List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                      currentConversation?.id === conv.id
                        ? "bg-gradient-to-r from-sky-100/80 to-cyan-100/80 dark:from-sky-900/60 dark:to-cyan-900/60 shadow-xl border border-sky-200/50 dark:border-sky-700/50"
                        : "hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-lg"
                    }`}
                    onClick={() => setCurrentConversation(conv)}
                  >
                    {editingConversationId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 text-sm border-0 bg-white/80 dark:bg-gray-800/80 rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateTitle(conv.id);
                            } else if (e.key === "Escape") {
                              setEditingConversationId(null);
                              setEditingTitle("");
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateTitle(conv.id);
                          }}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900 rounded-xl"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConversationId(null);
                            setEditingTitle("");
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate pr-2">
                            {conv.title}
                          </h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingConversationId(conv.id);
                                setEditingTitle(conv.title);
                              }}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-xl transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.id);
                              }}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-xl transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                          {formatDate(conv.updated_at)}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Enhanced Chat Header */}
                <div className="bg-gradient-to-r from-white/50 to-sky-50/50 dark:from-gray-800/50 dark:to-sky-900/50 backdrop-blur-2xl border-b border-white/30 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-sky-400 to-cyan-500 rounded-xl shadow-lg">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentConversation.title}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 ml-12">
                    Your intelligent climate companion • Powered by advanced AI
                  </p>
                </div>

                {/* Enhanced Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] p-5 rounded-3xl shadow-lg ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-sky-200 dark:shadow-sky-900"
                            : "bg-gradient-to-r from-white/80 to-sky-50/80 dark:from-gray-800/80 dark:to-sky-900/80 backdrop-blur-xl border border-white/30 text-gray-900 dark:text-white shadow-gray-200 dark:shadow-gray-800"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="text-sm leading-relaxed">
                            {renderMarkdownText(message.content)}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={`text-xs mt-3 font-medium ${
                            message.role === "user"
                              ? "text-sky-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-white/80 to-sky-50/80 dark:from-gray-800/80 dark:to-sky-900/80 backdrop-blur-xl border border-white/30 p-5 rounded-3xl shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            Climate AI is analyzing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Input Area */}
                <div className="bg-gradient-to-r from-white/50 to-sky-50/50 dark:from-gray-800/50 dark:to-sky-900/50 backdrop-blur-2xl border-t border-white/30 p-6 shadow-2xl">
                  <form onSubmit={handleSendMessage} className="flex gap-4">
                    <div className="flex-1 relative">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about climate solutions, sustainability tips, or environmental impact..."
                        disabled={isLoading}
                        className="w-full bg-white/80 dark:bg-gray-700/80 border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 text-base shadow-lg focus:shadow-xl transition-shadow"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white border-0 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-lg">
                  <div className="relative mb-8">
                    <div className="p-6 bg-gradient-to-r from-sky-500 to-cyan-600 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center shadow-2xl">
                      <MessageCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Climate Intelligence Hub
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                    Your AI-powered companion for climate action. Get expert
                    insights on sustainability, environmental impact, and
                    personalized eco-friendly solutions.
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                      <span>Real-time climate data analysis</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span>Personalized sustainability recommendations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Environmental impact calculations</span>
                    </div>
                  </div>
                  <Button
                    onClick={createNewConversation}
                    className="bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-4 rounded-2xl text-base font-semibold"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Begin Climate Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AuthGuard>

      <FloatingButtons
        pageTitle="Climate Chat Assistant"
        pageContext="AI-powered climate conversation interface for environmental questions, sustainability advice, and climate action guidance"
      />
    </div>
  );
}
