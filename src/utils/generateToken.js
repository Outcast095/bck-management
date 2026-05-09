import jwt from "jsonwebtoken";

/**
 * ГЕНЕРАЦИЯ И УСТАНОВКА ТОКЕНА
 * Принимает id пользователя и объект ответа res, чтобы прикрепить куку.
 */
export const generateToken = (userId, res) => {
  // ШАГ 1: Создаем полезную нагрузку (Payload)
  // Это данные, которые будут зашифрованы внутри токена. 
  // Мы кладем туда только ID, чтобы потом знать, кто делает запрос.
  const payload = { id: userId };

  // ШАГ 2: Подписываем токен
  // jwt.sign берет данные, наш секретный ключ и создает уникальную строку.
  // expiresIn: срок годности. Мы берем его из .env (например, "7d" — 7 дней).
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  // ШАГ 3: Отправка токена через Cookie
  // Это самый безопасный способ передачи токена для веба.
  res.cookie("jwt", token, {
    // httpOnly: true — ЗАЩИТА. Токен нельзя украсть через JavaScript (защита от XSS-атак).
    httpOnly: true, 
    
    // secure: true — отправлять куку только через зашифрованное соединение HTTPS.
    // Включается автоматически только в режиме 'production'.
    secure: process.env.NODE_ENV === "production", 
    
    // sameSite: "strict" — защита от CSRF-атак. Кука не будет отправляться на чужие сайты.
    sameSite: "strict", 
    
    // maxAge: время жизни куки в миллисекундах (здесь 7 дней).
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  });

  // Возвращаем токен, чтобы его можно было также отправить в теле JSON-ответа
  return token;
};