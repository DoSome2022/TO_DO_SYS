// next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * 擴充 Session 裡的 user 物件
   */
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  /**
   * 擴充 NextAuth 的 User 型別
   */
  interface User extends DefaultUser {
    id: string
    role: string
  }
}

declare module "next-auth/jwt" {
  /**
   * 擴充 JWT token 的型別
   */
  interface JWT {
    id: string
    role: string
  }
}

// 👇👇👇 這是解決 PrismaAdapter 錯誤的關鍵 👇👇👇
import { AdapterUser as DefaultAdapterUser } from "@auth/core/adapters"

declare module "@auth/core/adapters" {
  /**
   * 擴充 AdapterUser，讓 PrismaAdapter 知道資料庫回傳的 user 包含 role
   */
  export interface AdapterUser extends DefaultAdapterUser {
    id: string
    role: string
  }
}
