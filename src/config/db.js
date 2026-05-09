// это файл db.js,
// он находится по адресу src/config/db.js

import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Создаем пул подключений через классический драйвер pg
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Оборачиваем его в адаптер Prisma
const adapter = new PrismaPg(pool);

// 3. Передаем адаптер в клиент
const prisma = new PrismaClient({
  adapter, 
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ DB Connected via Prisma (Driver Adapter)");
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };