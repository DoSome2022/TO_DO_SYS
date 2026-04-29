// src/hooks/useProjectChat.ts
import { trpc } from "../trpc/client";

/**
 * Sales 的專案列表（含 QuotationVersions）
 */
export function useSalesProjects() {
  return trpc.projectMessage.getSalesProjects.useQuery();
}

/**
 * 取得某專案的對話紀錄
 */
export function useProjectMessages(projectId: string | null) {
  return trpc.projectMessage.getProjectMessages.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
}

/**
 * 發送對話訊息
 */
export function useSendProjectMessage() {
  const utils = trpc.useUtils();
  return trpc.projectMessage.sendProjectMessage.useMutation({
    onSuccess: (data) => {
      // 只 invalidate 該專案的對話
      utils.projectMessage.getProjectMessages.invalidate({
        projectId: data.projectId,
      });
    },
  });
}
