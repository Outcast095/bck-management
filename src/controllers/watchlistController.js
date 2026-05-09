import { prisma } from "../config/db.js";

/**
 * ДОБАВЛЕНИЕ В СПИСОК (Add to Watchlist)
 */
const addToWatchlist = async (req, res) => {
  // Извлекаем ID фильма и дополнительные данные из запроса
  const { movieId, status, rating, notes } = req.body;

  // ШАГ 1: Проверка на существование фильма.
  // Мы не можем добавить в список фильм, которого нет в нашей главной таблице Movie.
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  // ШАГ 2: Проверка на дубликат.
  // Используем уникальный составной ключ (userId + movieId), который мы прописали в схеме.
  // Это гарантирует, что юзер не добавит один и тот же фильм дважды.
  const existingInWatchlist = await prisma.watchlistItem.findUnique({
    where: {
      userId_movieId: {
        userId: req.user.id, // req.user.id берется из middleware авторизации
        movieId: movieId,
      },
    },
  });

  if (existingInWatchlist) {
    return res.status(400).json({ error: "Movie already in the watchlist" });
  }

  // ШАГ 3: Создание записи.
  // Если все проверки пройдены — сохраняем фильм в список конкретного юзера.
  const watchlistItem = await prisma.watchlistItem.create({
    data: {
      userId: req.user.id,
      movieId,
      status: status || "PLANNED", // Если статус не прислали, ставим "В планах" по умолчанию
      rating,
      notes,
    },
  });

  res.status(201).json({
    status: "Success",
    data: {
      watchlistItem,
    },
  });
};




/**
 * ОБНОВЛЕНИЕ ЗАПИСИ (Update Watchlist Item)
 * Позволяет изменить статус (например, с "Смотрю" на "Завершено"), оценку или заметку.
 */
const updateWatchlistItem = async (req, res) => {
  const { status, rating, notes } = req.body;

  // ШАГ 1: Поиск записи.
  // Ищем конкретный элемент списка по его ID из параметров ссылки (req.params.id)
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id: req.params.id },
  });

  if (!watchlistItem) {
    return res.status(404).json({ error: "Watchlist item not found" });
  }

  // ШАГ 2: БЕЗОПАСНОСТЬ (Проверка владельца).
  // Критически важный момент! Проверяем, что этот элемент списка принадлежит именно 
  // тому пользователю, который делает запрос. Чтобы Юзер А не мог изменить список Юзера Б.
  if (watchlistItem.userId !== req.user.id) {
    return res
      .status(403) // 403 Forbidden — доступ запрещен
      .json({ error: "Not allowed to update this watchlist item" });
  }

  // ШАГ 3: Сборка данных для обновления.
  // Мы создаем пустой объект и добавляем в него только те поля, которые прислал клиент.
  // Это позволяет обновлять, например, только оценку, не затирая статус.
  const updateData = {};
  if (status !== undefined) updateData.status = status.toUpperCase(); // Приводим статус к ВЕРХНЕМУ регистру для Enum
  if (rating !== undefined) updateData.rating = rating;
  if (notes !== undefined) updateData.notes = notes;

  // ШАГ 4: Выполнение обновления в базе
  const updatedItem = await prisma.watchlistItem.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: {
      watchlistItem: updatedItem,
    },
  });
};






/**
 * УДАЛЕНИЕ ИЗ СПИСКА (Remove from Watchlist)
 */
const removeFromWatchlist = async (req, res) => {
  // ШАГ 1: Поиск записи, чтобы убедиться, что она существует
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id: req.params.id },
  });

  if (!watchlistItem) {
    return res.status(404).json({ error: "Watchlist item not found" });
  }

  // ШАГ 2: Снова проверка прав. Удалять можно только свой список.
  if (watchlistItem.userId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not allowed to update this watchlist item" });
  }

  // ШАГ 3: Физическое удаление из базы данных
  await prisma.watchlistItem.delete({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "success",
    message: "Movie removed from watchlist",
  });
};

export { addToWatchlist, updateWatchlistItem, removeFromWatchlist };