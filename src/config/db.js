//Этот файл является «сердцем» твоего бэкенда. 
// Именно здесь настраивается «мост» между твоим кодом на JavaScript 
// и облачной базой данных PostgreSQL на Neon. Поскольку ты используешь Prisma 7, 
// здесь применен современный подход с использованием Driver Adapters.


import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * ШАГ 1: Создание пула подключений (Connection Pool)
 * Библиотека 'pg' — это классический драйвер для работы с PostgreSQL в Node.js.
 * Мы создаем 'Pool' (пул), который управляет множеством одновременных соединений с базой.
 * Это позволяет приложению не открывать новое соединение на каждый запрос, 
 * а переиспользовать уже открытые, что в разы ускоряет работу.
 */
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * ШАГ 2: Адаптер Prisma (Prisma Driver Adapter)
 * Это связующее звено. Prisma сама по себе — это мощный инструмент, но в 7-й версии
 * она делегирует низкоуровневую работу с сетью драйверу 'pg'.
 * PrismaPg берет наш созданный пул и подготавливает его для работы внутри Prisma.
 */
const adapter = new PrismaPg(pool);

/**
 * ШАГ 3: Инициализация клиента Prisma
 * Здесь мы создаем главный объект 'prisma', через который ты будешь делать 
 * все запросы (findMany, create и т.д.).
 */
const prisma = new PrismaClient({
  adapter, // Передаем наш адаптер вместо прямой строки подключения
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"] // В режиме разработки видим все SQL-запросы в консоли
      : ["error"],               // В продакшене — только серьезные ошибки
});

/**
 * Функция для установки соединения
 * Она вызывается один раз при старте сервера в server.js.
 */
const connectDB = async () => {
  try {
    // Пытаемся физически "постучаться" в базу данных
    await prisma.$connect();
    console.log("✅ DB Connected via Prisma (Driver Adapter)");
  } catch (error) {
    // Если база недоступна (неверный пароль, нет интернета), выводим ошибку
    console.error(`❌ Database connection error: ${error.message}`);
    // Принудительно завершаем работу сервера, так как без базы он бесполезен
    process.exit(1);
  }
};

/**
 * Функция для разрыва соединения
 * Нужна для "чистого" выключения сервера, чтобы база данных не держала 
 * лишние пустые подключения.
 */
const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };