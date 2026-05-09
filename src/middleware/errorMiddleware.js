// Этот код — централизованная система обработки ошибок. 
// Вместо того чтобы в каждом контроллере писать громоздкие блоки try-catch с отправкой ответов,
// ты собираешь все ошибки в одном месте и превращаешь технические сообщения базы данных 
// в понятные ответы для пользователя.


import { Prisma } from "@prisma/client";

/**
 * ОБРАБОТКА НЕСУЩЕСТВУЮЩИХ РОУТОВ (404 Not Found)
 * Этот middleware сработает, если запрос не подошел ни под один из твоих роутов (movies, auth и т.д.)
 */
const notFound = (req, res, next) => {
  // Создаем объект ошибки и записываем туда путь, который искал пользователь
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404; // Устанавливаем статус 404
  
  // Передаем ошибку дальше. Если в next() передать аргумент, 
  // Express пропустит все обычные роуты и перейдет сразу к обработчику ошибок ниже.
  next(error);
};

/**
 * ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК (Global Error Handler)
 * Это "последняя инстанция". Все ошибки из всех контроллеров и middleware стекаются сюда.
 */
const errorHandler = (err, req, res, next) => {
  // Если у ошибки нет статуса, по умолчанию ставим 500 (Internal Server Error)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // --- БЛОК ОБРАБОТКИ ОШИБОК PRISMA ---
  
  // 1. Ошибки валидации (например, передали строку там, где нужно число)
  if (err instanceof Prisma.PrismaClientValidationError) {
    err.statusCode = 400; // Плохой запрос
    err.message = "Invalid data provided";
  }

  // 2. Известные ошибки запросов к БД (нарушение ограничений)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    
    // Ошибка P2002: Нарушение уникальности (например, такой email уже есть в базе)
    if (err.code === "P2002") {
      // Пытаемся вытащить имя поля, на котором произошла ошибка (например, "email")
      const field = err.meta?.target?.[0] || "field";
      err.statusCode = 400;
      err.message = `${field} already exists`;
    }
    
    // Ошибка P2025: Запись для обновления или удаления не найдена
    if (err.code === "P2025") {
      err.statusCode = 404;
      err.message = "Record not found";
    }
    
    // Ошибка P2003: Ошибка внешнего ключа (например, попытка добавить фильм к несуществующему юзеру)
    if (err.code === "P2003") {
      err.statusCode = 400;
      err.message = "Invalid reference: related record does not exist";
    }
  }

  // --- ФИНАЛЬНАЯ ОТПРАВКА ОТВЕТА КЛИЕНТУ ---
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    
    // БЕЗОПАСНОСТЬ: Стек вызовов (stack trace) показываем только в режиме разработки (development).
    // В production обычный пользователь не должен видеть структуру твоего кода.
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export { notFound, errorHandler };