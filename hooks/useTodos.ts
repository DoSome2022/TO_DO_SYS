// // src/hooks/useTodos.ts

// import { trpc } from "../trpc/client";


// /**
//  * 取得當前登入員工的個人待辦清單 (Staff_TODO)
//  */
// export function useMyStaffTodos() {
//   return trpc.todo.getMyTasks.useQuery();
// }

// /**
//  * 切換待辦完成狀態
//  */
// export function useToggleStaffTodo() {
//   const utils = trpc.useUtils();
//   return trpc.todo.toggleStaffTodo.useMutation({
//     onSuccess: () => {
//       utils.todo.getMyTasks.invalidate();
//     },
//   });
// }

// /**
//  * 取得 PM 的待辦清單 (PM 專用)
//  */
// export function useMyPMTodos() {
//   return trpc.todo.getMyTasks.useQuery();
// }


// src/hooks/useTodos.ts

import { trpc } from "../trpc/client";

/**
 * 取得當前登入員工的個人待辦清單 (Staff_TODO)
 */
export function useMyStaffTodos() {
  return trpc.todo.getMyTasks.useQuery();
}

/**
 * 切換待辦完成狀態
 */
export function useToggleStaffTodo() {
  const utils = trpc.useUtils();
  return trpc.todo.toggleStaffTodo.useMutation({
    onSuccess: () => {
      utils.todo.getMyTasks.invalidate();
    },
  });
}

/**
 * 新增個人待辦
 */
export function useCreateStaffTodo() {
  const utils = trpc.useUtils();
  return trpc.todo.createToDo_Staff.useMutation({
    onSuccess: () => {
      utils.todo.getMyTasks.invalidate();
    },
  });
}

/**
 * 編輯個人待辦（標題、截止日）
 */
export function useUpdateStaffTodo() {
  const utils = trpc.useUtils();
  return trpc.todo.updateToDo_Staff.useMutation({
    onSuccess: () => {
      utils.todo.getMyTasks.invalidate();
    },
  });
}

/**
 * 刪除個人待辦
 */
export function useDeleteStaffTodo() {
  const utils = trpc.useUtils();
  return trpc.todo.deleteToDo_Staff.useMutation({
    onSuccess: () => {
      utils.todo.getMyTasks.invalidate();
    },
  });
}

/**
 * 取得 PM 的待辦清單 (PM 專用)
 */
export function useMyPMTodos() {
  return trpc.todo.getMyTasks.useQuery();
}
