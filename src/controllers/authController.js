import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

/**
 * РЕГИСТРАЦИЯ (Создание нового аккаунта)
 */
const register = async (req, res) => {
  // Достаем данные, которые прислал пользователь из формы
  const { name, email, password } = req.body;

  // ШАГ 1: Проверка на дубликат. 
  // Мы не хотим, чтобы было два пользователя с одинаковой почтой.
  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });

  if (userExists) {
    // 400 Bad Request — клиент ошибся, такой email занят
    return res
      .status(400)
      .json({ error: "User already exists with this email" });
  }

  // ШАГ 2: Безопасность пароля.
  // Мы НИКОГДА не храним пароль в чистом виде (например, "123456").
  // genSalt(10) создает "соль" — случайный шум, чтобы хакерам было сложнее взломать базу.
  const salt = await bcrypt.genSalt(10);
  // Превращаем "123456" в нечитаемую строку символов (хэш)
  const hashedPassword = await bcrypt.hash(password, salt);

  // ШАГ 3: Запись в базу данных
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword, // сохраняем именно хэш
    },
  });

  // ШАГ 4: Авторизация сразу после регистрации.
  // Генерируем токен, чтобы пользователю не нужно было логиниться вручную сразу после создания аккаунта.
  const token = generateToken(user.id, res);

  // Отправляем ответ. Пароль в ответ НЕ включаем из соображений безопасности.
  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: name,
        email: email,
      },
      token,
    },
  });
};





/**
 * ВХОД (Логин)
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // ШАГ 1: Ищем пользователя по почте
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  // Если пользователя нет — выходим
  if (!user) {
    // Используем 401 Unauthorized
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // ШАГ 2: Проверка пароля.
  // Поскольку пароль захэширован, мы не можем его просто "прочитать".
  // bcrypt.compare берет пароль из ввода, хэширует его с той же солью и сравнивает результаты.
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // Важно: выдаем ту же ошибку "Invalid email or password", 
    // чтобы злоумышленник не понял, что именно было введено верно (почта или пароль).
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // ШАГ 3: Выдача пропуска (Токена)
  const token = generateToken(user.id, res);

  res.status(200).json({ // Обычно для логина используют 200 OK
    status: "success",
    data: {
      user: {
        id: user.id,
        email: email,
      },
      token,
    },
  });
};






/**
 * ВЫХОД (Логаут)
 */
const logout = async (req, res) => {
  // ШАГ 1: Очистка куки.
  // Мы заменяем содержимое куки "jwt" на пустую строку и ставим срок жизни в прошлое (expires: 0).
  // Браузер увидит это и сразу удалит куку.
  res.cookie("jwt", "", {
    httpOnly: true, // Кука недоступна для JavaScript (защита от XSS атак)
    expires: new Date(0),
  });
  
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export { register, login, logout };