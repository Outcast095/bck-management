import express from 'express';
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";

// Импорт маршрутов (Routes) — это логические блоки твоего API
import movieRoutes from "./routes/movieRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";

/**
 * ПОДГОТОВКА СРЕДЫ
 */
config();    // Читает файл .env и записывает данные в process.env (порт, секреты и т.д.)
connectDB(); // Инициирует подключение к PostgreSQL через Prisma

const app = express();     

/**
 * MIDDLEWARE (Промежуточное ПО)
 * Эти функции обрабатывают запрос ДО того, как он попадет в твои роуты.
 */
app.use(express.json()); // Позволяет серверу понимать формат JSON в теле запроса
app.use(express.urlencoded({ extended: true })); // Позволяет работать с данными из стандартных HTML-форм

/**
 * ОПРЕДЕЛЕНИЕ МАРШРУТОВ (API Routes)
 * Мы группируем запросы по смыслу. 
 * Все, что начинается на /movies, уходит в movieRoutes и так далее.
 */
app.use("/movies", movieRoutes);
app.use("/auth", authRoutes);
app.use("/watchlist", watchlistRoutes);

/**
 * ЗАПУСК СЕРВЕРА
 * Слушаем входящие подключения на порту из .env или на 5001 по умолчанию.
 * "0.0.0.0" позволяет серверу быть доступным не только внутри твоего ПК, но и в локальной сети.
 */
const server = app.listen(process.env.PORT || 5001, "0.0.0.0", () => {
  console.log(`Server running on PORT ${process.env.PORT}`);
});

/**
 * ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК (Системная безопасность)
 */

// unhandledRejection: ловит ошибки в промисах (async/await), которые не обернуты в try/catch
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB(); // Закрываем соединение с базой перед выходом
    process.exit(1);      // Выход с кодом ошибки
  });
});

// uncaughtException: ловит программные ошибки (например, обращение к несуществующей переменной)
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

/**
 * ГРАЦИОЗНОЕ ЗАВЕРШЕНИЕ (Graceful Shutdown)
 * SIGTERM — это сигнал, который посылает хостинг или система при остановке сервера.
 * Вместо того чтобы просто "выдернуть вилку", сервер:
 * 1. Перестает принимать новые запросы.
 * 2. Дожидается завершения текущих задач.
 * 3. Корректно закрывает связь с БД.
 * 4. Выключается.
 */
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0); // Чистый выход без ошибок
  });
});