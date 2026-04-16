// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // 引用剛剛建的 auth.ts

export const { GET, POST } = handlers
