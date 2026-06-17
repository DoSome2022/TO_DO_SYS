// auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/app/lib/prisma" 
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
// ✅ 正確擴充 Session 類型
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string
//       role: string
//       name?: string | null
//       email?: string | null
//       image?: string | null
//     }
//   }
  
//   interface User {
//     role: string
//   }
// }
// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string
//     role: string
//   }
// }
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    // --- 1. 員工登入 (Staff) ---
    CredentialsProvider({
      id: "staff-login",
      name: "Staff Login",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { name: credentials.name as string }
        });
        if (!user || !user.password) return null;
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (passwordsMatch) {
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role
          };
        }
        return null;
      }
    }),
    // --- 2. 客人登入 (Customer) ---
    CredentialsProvider({
      id: "customer-login",
      name: "Customer Login",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;
        const customer = await db.customer.findFirst({
          where: { name: credentials.name as string }
        });
        if (!customer || !customer.password) return null;
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          customer.password
        );
        if (passwordsMatch) {
          return { 
            id: customer.id, 
            name: customer.name, 
            email: customer.email,
            role: "customer"
          };
        }
        return null;
      }
    })
  ],
})

// // auth.ts
// import NextAuth from "next-auth"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { PrismaAdapter } from "@auth/prisma-adapter"
// import { db } from "@/app/lib/prisma" 
// import bcrypt from "bcryptjs"

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(db),
//   session: { strategy: "jwt" }, 
//   pages: {
//     signIn: "/auth/login", // 換成您剛建立的客戶/共用登入頁面
//   },
//   providers: [
//     // --- 1. 員工登入 (Staff) ---
//     CredentialsProvider({
//       id: "staff-login", // 設定獨立的 ID
//       name: "Staff Login",
//       credentials: {
//         name: { label: "Name", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         if (!credentials?.name || !credentials?.password) return null;

//         const user = await db.user.findUnique({
//           where: { name: credentials.name as string }
//         });

//         if (!user || !user.password) return null;

//         const passwordsMatch = await bcrypt.compare(
//           credentials.password as string,
//           user.password
//         );

//         if (passwordsMatch) {
//           // 登入成功，回傳資料並加上 role: "staff"
//           return { id: user.id, name: user.name, role: user.role };
//         }
//         return null;
//       }
//     }),

//     // --- 2. 客人登入 (Customer) ---
// // auth.ts 的片段
//     // --- 2. 客人登入 (Customer) ---
//     CredentialsProvider({
//       id: "customer-login",
//       name: "Customer Login",
//       credentials: {
//         // 1. 改成接收 name (使用者名稱)
//         name: { label: "Name", type: "text" }, 
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         // 2. 檢查 credentials?.name 是否存在
//         if (!credentials?.name || !credentials?.password) return null;

//         // 3. 改用 name 去 customer 表格裡面找人
//         const customer = await db.customer.findFirst({
//           where: { name: credentials.name as string } 
//         });

//         if (!customer || !customer.password) return null;

//         const passwordsMatch = await bcrypt.compare(
//           credentials.password as string,
//           customer.password
//         );

//         if (passwordsMatch) {
//           return { id: customer.id, name: customer.name, email: customer.email, role: "customer" };
//         }
//         return null;
//       }
//     })

//   ],
//   callbacks: {
//     // 把 User ID 和 Role 塞進 JWT token 裡
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = (user as any).role; // 儲存角色
//       }
//       return token;
//     },
//     // 把 token 的資料傳遞給客戶端的 Session
//     async session({ session, token }) {
//       if (token && session.user) {
//         session.user.id = token.id as string;
//         (session.user as any).role = token.role as string; // 讓前端可以讀取角色
//       }
//       return session;
//     }
//   }
// })
