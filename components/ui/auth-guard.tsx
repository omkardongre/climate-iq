"use client";

import { useAuth } from "@/components/auth-provider";
import { AuthForm } from "@/components/ui/auth-form";
import { Loader2, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean; // New prop to control if auth is required
}

export function AuthGuard({
  children,
  fallback,
  requireAuth = false,
}: AuthGuardProps): JSX.Element {
  const { user, loading } = useAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && requireAuth) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4">
        <AuthForm />
      </div>
    );
  }

  // Show auth banner for non-authenticated users (but still allow access)
  if (!user && !requireAuth) {
    return (
      <div className="relative">
        {/* Auth Banner */}
        {/* <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Sign in to save your data
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You can explore all features. Sign in to persist your goals and preferences.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAuthForm(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div> */}

        {/* Auth Form Modal */}
        {showAuthForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Sign In to OutbackVision AI</CardTitle>
                <CardDescription>
                  Save your goals and track your environmental impact over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm onClose={() => setShowAuthForm(false)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
