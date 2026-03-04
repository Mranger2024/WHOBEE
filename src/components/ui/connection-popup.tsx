"use client";

import React from "react";
import { Users } from "lucide-react";
import { Button } from "./button";

interface ConnectionPopupProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
  onCancel?: () => void;
}

export function ConnectionPopup({
  isVisible,
  message = "Searching for a partner...",
  subMessage = "Please wait while we find someone for you to chat with",
  onCancel
}: ConnectionPopupProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center  z-50 bg-white/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-8 backdrop-blur-md ml-2 mr-2 mt-10 bg-white/50 max-w-md w-full text-center">
        <     div className="relative h-20 w-20 mx-auto mb-6">
          c   <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse opacity-50"></div>
          <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Searching for a partner...</h2>
        <p className="text-muted-foreground mb-8">Please wait while we find someone for you to chat with</p>


        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>

  );
}
