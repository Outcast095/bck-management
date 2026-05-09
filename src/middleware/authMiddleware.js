//Этот код — «пограничный контроль» твоего приложения. 
// Это Middleware (промежуточное ПО), которое стоит перед защищенными роутами и проверяет «паспорт» 
// (токен) у каждого входящего запроса. Если токена нет или он фальшивый — дальше в систему запрос не пройдет.


import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

// Основная функция-фильтр, которая проверяет авторизацию
export const authMiddleware = async (req, res, next) => {
  let token;

  // ШАГ 1: Извлекаем токен. 
  // Мы поддерживаем два способа передачи: 
  // 1. Стандартный заголовок 'Authorization: Bearer <token>'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Отрезаем слово "Bearer " и берем только сам токен
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2. Либо берем токен из куки (если фронтенд использует Cookies)
  else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // ШАГ 2: Если токена нет ни в заголовках, ни в куках — разворачиваем запрос
  if (!token) {
    // 401 Unauthorized — стандартный ответ, когда личность не подтверждена
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    // ШАГ 3: Проверка подлинности (Дешифровка)
    // jwt.verify расшифровывает токен с помощью нашего секретного ключа из .env.
    // Если секрет не совпадает или срок жизни токена истек — вылетит ошибка в блок catch.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ШАГ 4: Поиск пользователя в базе
    // В токене был зашит ID пользователя. Теперь мы идем в БД, чтобы убедиться, 
    // что такой пользователь реально существует и его аккаунт не удален.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    // Если токен валидный, но юзера в базе уже нет (например, удален) — отказ
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // ШАГ 5: Передача данных дальше
    // Мы записываем данные пользователя прямо в объект запроса (req.user).
    // Теперь в любом следующем контроллере мы сможем достать его через req.user.id.
    req.user = user;
    
    // Вызываем next(), чтобы пропустить запрос к самому контроллеру (например, addToWatchlist)
    next();
  } catch (err) {
    // ШАГ 6: Обработка ошибок (токен неверный, подделан или просрочен)
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};