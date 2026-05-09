npm install express
npm install nodemon --save-dev
npm install dotenv // для работы с локальными средами
npm install zod // для валидации данных
npm install jsonwebtoken
npm install bcryptjs // для шифровки хеширования пароля

npx prisma init
npm install prisma --save-dev
npm install @prisma/client
npm install pg @prisma/adapter-pg

openssl rand -base64 32 // команда для генерации ключей

-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$\_}) // команда для генерации ключей

node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" // команда для генерации ключей
