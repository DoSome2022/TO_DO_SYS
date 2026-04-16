// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'                        // 根據您的資料庫改成 mysql2 / better-sqlite3 等
import { PrismaPg } from '@prisma/adapter-pg'   // 對應改成 @prisma/adapter-mysql 等
const prismaClientSingleton = () => {

    const connectionString = process.env.DATABASE_URL;

    const pool = new Pool({ connectionString })

    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
        // 關鍵：傳入 adapter
        adapter,
    })


}

// 以下保持不變
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const db = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

export { db }