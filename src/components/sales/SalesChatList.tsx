"use client";

import { useState, useMemo } from "react";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Search, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { api } from "@/utils/api";

// ─── Props ─────────────────────────────────────────
interface Props {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string, projectTitle: string) => void;
}

// ─── Component ─────────────────────────────────────
export default function SalesChatList({
  selectedProjectId,
  onSelectProject,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  // ── tRPC ──
  const { data: channels, isLoading } = api.projectSalesChannel.listMyChannels.useQuery();
  const { data: currentUser } = api.user.getMyProfile.useQuery();
  const currentUserId = currentUser?.id;

  // ── 過濾邏輯 ──
  const filteredChannels = useMemo(() => {
    if (!channels) return [];

    return channels.filter((ch) => {
      const matchesSearch = !searchTerm
        ? true
        : ch.title.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [channels, searchTerm]);

  // ── Render ──
  return (
    <div className="w-[380px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          我的專案對話
        </h2>

        {/* 搜尋 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋我的專案..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 列表 */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2" />
            <p className="text-sm">
              {searchTerm ? "沒有符合的專案" : "尚無指派給你的專案"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChannels.map((channel) => {
              const isActive = channel.id === selectedProjectId;
              const lastMsg = channel.lastMessage;

              return (
                <button
                  key={channel.id}
                  onClick={() => onSelectProject(channel.id, channel.title)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50
                    ${isActive ? "bg-green-50 border-l-2 border-l-green-500" : ""}
                  `}
                >
                  {/* 專案名稱 */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[240px]">
                      {channel.title}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {format(new Date(lastMsg.createdAt), "MM/dd HH:mm", {
                          locale: zhTW,
                        })}
                      </span>
                    )}
                  </div>

                  {/* 最新訊息預覽 */}
                  {lastMsg ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 shrink-0">
                        {lastMsg.sender.name}:
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {lastMsg.content}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">尚無訊息</span>
                  )}

                  {/* 未讀標記 */}
                  {lastMsg && !lastMsg.readAt && lastMsg.senderId !== currentUserId && (
                    <div className="mt-1 flex">
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        未讀
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* 底部統計 */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          共 {filteredChannels.length} 個我的專案
        </p>
      </div>
    </div>
  );
}
