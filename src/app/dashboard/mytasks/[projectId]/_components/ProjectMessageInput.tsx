"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export default function ProjectMessageInput({
  onSend,
  isPending,
}: {
  onSend: (content: string) => void;
  isPending: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="border-t p-3 bg-white rounded-b-lg">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="輸入訊息..."
          disabled={isPending}
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !input.trim()}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
