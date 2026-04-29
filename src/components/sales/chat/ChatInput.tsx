// components/sales/chat/ChatInput.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;  // ✅ 改為 void，不接受 Promise
  isSending: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isSending, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自動調整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isSending) return;
    
    onSend(message.trim());  // ✅ 直接呼叫，不需要 await
    setMessage("");
    
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "輸入訊息..."}
          className="min-h-[40px] max-h-[200px] resize-none"
          rows={1}
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className="self-end"
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}