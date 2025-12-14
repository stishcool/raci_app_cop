# 🚀 CRM RACI System - Система управления проектами

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)

> ⚠️ **Внимание**: Части этого README, файл `CRM_RACI_Complete_Collection.json` и `.gitignore` были сгенерированы с помощью нейросети и могут содержать неточности. Пожалуйста, проверяйте актуальность информации.

Полнофункциональная веб-система для управления проектами с матрицей RACI (Responsible, Accountable, Consulted, Informed). Frontend на React + TypeScript, Backend на Flask + SQLAlchemy.

## 📋 Содержание

- [Описание](#-описание)
- [Возможности](#-возможности)
- [Технологический стек](#️-технологический-стек)
- [Структура проекта](#-структура-проекта)
- [Быстрый старт](#-быстрый-старт)
- [Backend API](#-backend-api)
- [Frontend](#-frontend)
- [Роли пользователей](#-роли-пользователей)
- [RACI матрица](#-raci-матрица)
- [Скриншоты](#-скриншоты)
- [Production Deployment](#-production-deployment)
- [Лицензия](#-лицензия)

## 📖 Описание

**CRM RACI System** - это современное веб-приложение для эффективного управления проектами с жестким контролем зон ответственности. Система построена на микросервисной архитектуре с разделением Frontend и Backend, использует JWT аутентификацию и поддерживает темную тему.

### 🎯 Ключевые преимущества:

- **Четкое распределение ролей** - используйте методологию RACI для каждой задачи
- **Визуализация ответственности** - интерактивная RACI матрица
- **Kanban доска** - удобный drag-and-drop для управления задачами
- **Аудит действий** - полное логирование всех операций
- **Контроль доступа** - трехуровневая система ролей (Admin, PM, Team Member)
- **Адаптивный дизайн** - работает на всех устройствах
- **Темная тема** - комфортная работа в любое время суток

## ✨ Возможности

### Для Project Manager:
- ✅ Создание и управление проектами
- ✅ Формирование команд проектов
- ✅ Создание и назначение задач
- ✅ Распределение RACI ролей
- ✅ Kanban доска с drag-and-drop
- ✅ Визуализация RACI матрицы
- ✅ Экспорт RACI в CSV
- ✅ Контроль загруженности команды

### Для Team Member:
- ✅ Просмотр назначенных задач по ролям (R/A/C/I)
- ✅ Обновление статусов задач
- ✅ Комментирование и обсуждения
- ✅ Загрузка файлов к задачам
- ✅ Уведомления о важных событиях

### Для Administrator:
- ✅ Одобрение/отклонение проектов
- ✅ Управление пользователями
- ✅ Просмотр глобальных логов
- ✅ Контроль всех проектов системы
- ✅ Генерация паролей для новых пользователей

## 🛠️ Технологический стек

### Backend:
- **Framework:** Flask 3.0.0
- **ORM:** SQLAlchemy 2.0
- **Database:** SQLite (легко мигрирует на PostgreSQL)
- **Authentication:** JWT (Flask-JWT-Extended)
- **Password Security:** bcrypt
- **Validation:** email-validator
- **CORS:** Flask-CORS
- **File Upload:** werkzeug

### Frontend:
- **Framework:** React 18.3
- **Language:** TypeScript 5.0
- **Build Tool:** Vite 5.0
- **UI Library:** Tailwind CSS 3.4
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router DOM v6
- **Forms:** React Hook Form + Zod
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **Date:** date-fns

## 📁 Структура проекта

```
CRM-RACI-System/
├── backend/                    # Flask Backend API
│   ├── app/
│   │   ├── __init__.py        # Инициализация Flask
│   │   ├── config.py          # Конфигурация
│   │   ├── database.py        # SQLAlchemy setup
│   │   ├── models/            # Модели БД
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── task.py
│   │   │   └── raci.py
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── tasks.py
│   │   │   ├── raci.py
│   │   │   ├── admin.py
│   │   │   └── dashboard.py
│   │   ├── services/          # Бизнес-логика
│   │   └── utils/             # Утилиты
│   ├── uploads/               # Загруженные файлы
│   ├── requirements.txt
│   ├── run.py
│   └── .env
│
├── frontend/                  # React Frontend SPA
│   ├── src/
│   │   ├── api/              # API клиенты
│   │   ├── components/       # React компоненты
│   │   │   ├── ui/          # UI kit (Button, Card, etc.)
│   │   │   ├── features/    # Бизнес-компоненты
│   │   │   └── layout/      # Layout компоненты
│   │   ├── contexts/        # React Context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Страницы приложения
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript типы
│   │   ├── lib/             # Утилиты
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── CRM_RACI_Complete_Collection.json  # Postman коллекция
└── README.md
```

## 🚀 Быстрый старт

### Предварительные требования:
- Python 3.10+
- Node.js 18+
- npm или yarn

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd CRM-RACI-System
```

### 2. Запуск Backend

```bash
# Переход в папку backend
cd backend

# Создание виртуального окружения
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Создание .env файла (скопируйте содержимое ниже)

# Инициализация БД
flask init-db

# Создание администратора (username: admin, password: admin123)
flask create-admin

# (Опционально) Тестовые данные
flask seed-data

# Запуск сервера
python run.py
```

Backend будет доступен на: **http://localhost:5000**

### 3. Запуск Frontend

```bash
# Откройте новый терминал
cd frontend

# Установка зависимостей
npm install

# Создание .env файла
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Запуск dev сервера
npm run dev
```

Frontend будет доступен на: **http://localhost:5173**

### 4. Вход в систему

Откройте браузер и перейдите на **http://localhost:5173**

**Тестовые учетные данные:**

**Администратор:**
- Username: `admin`
- Password: `admin123`

**Менеджер проектов** (если выполнили `flask seed-data`):
- Username: `ivanov`
- Password: `password123`

**Участники команды:**
- Username: `petrov`, `sidorov`, `kozlov`, `morozov`
- Password: `password123`

## 🔧 Backend API

### Конфигурация (.env)

Создайте файл `backend/.env`:

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=secret-key
JWT_SECRET_KEY=jwt-secret-key
DATABASE_URL=sqlite:///crm_raci.db
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### API Endpoints

#### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Регистрация нового пользователя |
| POST | `/login` | Вход в систему (получение JWT) |
| GET | `/me` | Получить текущего пользователя |
| POST | `/refresh` | Обновить access token |
| PUT | `/profile` | Обновить профиль |
| POST | `/profile/avatar` | Загрузить аватар |
| DELETE | `/profile/avatar` | Удалить аватар |

#### 📁 Projects (`/api/projects`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Список проектов (filter: all/active/my) |
| POST | `/` | Создать проект |
| GET | `/:id` | Получить проект по ID |
| PUT | `/:id` | Обновить проект |
| POST | `/:id/request-publication` | Запросить публикацию |
| POST | `/:id/team` | Добавить участника в команду |
| DELETE | `/:id/team/:user_id` | Удалить участника |
| GET | `/:id/logs` | Логи проекта |

#### ✅ Tasks (`/api/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Создать задачу |
| GET | `/project/:project_id` | Задачи проекта |
| GET | `/:id` | Получить задачу |
| PUT | `/:id` | Обновить задачу |
| DELETE | `/:id` | Удалить задачу |
| GET | `/my-tasks` | Мои задачи по RACI ролям |

**Статусы задач:** `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `BLOCKED`  
**Приоритеты:** `LOW(1)`, `MEDIUM(2)`, `HIGH(3)`, `CRITICAL(4)`

#### 🎯 RACI Matrix (`/api/raci`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assign` | Назначить RACI роль |
| DELETE | `/assignment/:id` | Удалить назначение |
| GET | `/task/:task_id` | RACI роли задачи |
| GET | `/project/:project_id/matrix` | RACI матрица проекта |
| GET | `/task/:task_id/validate` | Валидация RACI |

#### 📊 Dashboard (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Статистика дашборда |
| GET | `/team-workload` | Загрузка команды |

#### 🔧 Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pending-projects` | Проекты на одобрение |
| POST | `/approve-project/:id` | Одобрить проект |
| POST | `/reject-project/:id` | Отклонить проект |
| GET | `/logs` | Глобальные логи |
| GET | `/users` | Все пользователи |
| POST | `/users/create` | Создать пользователя |
| PUT | `/users/:id` | Обновить пользователя |
| DELETE | `/users/:id` | Деактивировать пользователя |

### Аутентификация API

Все защищенные endpoints требуют JWT токен в заголовке:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Пример получения токена:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 💻 Frontend

### Конфигурация (.env)

Создайте файл `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Основные страницы

- **`/`** - Дашборд (статистика, мои задачи, загруженность)
- **`/projects`** - Список проектов (поиск, фильтры)
- **`/projects/:id`** - Детали проекта (задачи, Kanban, RACI, история)
- **`/profile`** - Профиль пользователя
- **`/admin`** - Панель администратора
- **`/login`** - Страница входа

### Основные компоненты

#### UI Kit (`src/components/ui/`)
- Button, Input, Card, Badge
- Avatar, Skeleton, Tabs
- Dialog, Sheet, Select

#### Features (`src/components/features/`)
- **KanbanBoard** - Drag-and-drop доска задач
- **RACIMatrix** - Интерактивная RACI матрица
- **ProjectCard** - Карточка проекта
- **TaskItem** - Карточка задачи
- **ActivityTimeline** - Лента событий
- **CreateProjectDialog** - Модалка создания проекта
- **CreateTaskDialog** - Модалка создания задачи

#### Layout (`src/components/layout/`)
- **Sidebar** - Боковое меню с навигацией
- **Header** - Шапка с глобальным поиском
- **ProtectedRoute** - HOC для защиты роутов

### State Management

Используется **Zustand** для управления глобальным состоянием:

```typescript
// Пример: authStore
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (credentials) => { /* ... */ },
  logout: () => { /* ... */ },
  updateUser: (user) => set({ user }),
}));
```

### API Клиенты

Все API запросы инкапсулированы в `src/api/`:

```typescript
// Пример: projectsApi
export const projectsApi = {
  getProjects: (filter?: string) => api.get('/projects', { params: { filter } }),
  getProject: (id: number) => api.get(`/projects/${id}`),
  createProject: (data: CreateProjectDTO) => api.post('/projects', data),
  // ...
};
```

### Темная тема

Переключение темы через контекст `ThemeContext`:

```typescript
const { theme, toggleTheme } = useTheme();
```

Tailwind настроен на автоматическое применение `dark:` классов.

## 🎭 Роли пользователей

### 🔴 ADMIN (Администратор)
- Полный доступ ко всем проектам и задачам
- Одобрение/отклонение проектов
- Управление пользователями (создание, редактирование, деактивация)
- Просмотр глобальных логов и аудита
- Генерация паролей для новых пользователей

### 🟡 PROJECT_MANAGER (Менеджер проектов)
- Создание и управление своими проектами
- Формирование команды проекта
- Создание задач и назначение RACI ролей
- Запрос публикации проектов (одобряет Admin)
- Просмотр RACI матрицы и загруженности команды

### 🟢 TEAM_MEMBER (Участник команды)
- Просмотр проектов, в которых участвует
- Просмотр и выполнение назначенных задач
- Обновление статуса своих задач
- Загрузка файлов к задачам
- Комментирование задач

## 🎯 RACI Матрица

### Что такое RACI?

**RACI** - это методология распределения ответственности в проектах:

| Роль | Описание | Правила |
|------|----------|---------|
| **R** - Responsible | **Исполнитель** - тот, кто выполняет работу | Может быть несколько |
| **A** - Accountable | **Ответственный** - принимает работу и несет ответственность | **Только один!** |
| **C** - Consulted | **Консультант** - дает советы и рекомендации | Может быть несколько |
| **I** - Informed | **Информируемый** - получает уведомления о ходе работы | Может быть несколько |

### Правила валидации RACI:

✅ Каждая задача **должна** иметь хотя бы одного Исполнителя (R)  
✅ Каждая задача **должна** иметь ровно одного Ответственного (A)  
✅ Роли C и I опциональны

### Пример RACI матрицы:

| Задача | Иванов | Петров | Сидоров |
|--------|--------|--------|---------|
| Создать дизайн | **A** | **R** | **I** |
| Разработать API | **R** | **A** | **C** |
| Написать тесты | **I** | **R** | **A** |

### Использование в системе:

1. Создайте задачу в проекте
2. Перейдите на вкладку "RACI матрица"
3. Кликните на ячейку пользователь-задача
4. Выберите роль (R/A/C/I)
5. Система автоматически валидирует назначения
6. Экспортируйте матрицу в CSV для отчетности

## 🔄 Жизненный цикл проекта

```
   DRAFT
     ↓
PENDING_APPROVAL
   ↙   ↘
ACTIVE  REJECTED
   ↓
COMPLETED
```

1. **DRAFT** - Черновик (формирование команды, создание задач)
2. **PENDING_APPROVAL** - Ожидает одобрения администратора
3. **ACTIVE** - Активный проект (работа ведется)
4. **REJECTED** - Отклонен администратором (требует доработки)
5. **COMPLETED** - Завершен

## 📸 Скриншоты

*(Добавьте скриншоты вашего приложения)*

### Дашборд
![Dashboard](.github/screenshots/dashboard.png)

### Kanban доска
![Kanban](.github/screenshots/kanban.png)

### RACI Матрица
![RACI](.github/screenshots/raci-matrix.png)

### Темная тема
![Dark Mode](.github/screenshots/dark-mode.png)

## 🧪 Тестирование

### Backend (Postman)

1. Импортируйте коллекцию `CRM_RACI_Complete_Collection.json` в Postman
2. Выполните запрос **"Login - Admin"**
3. Токен автоматически сохранится в переменную окружения
4. Тестируйте остальные endpoints

### Frontend (Manual Testing)

Рекомендуемая последовательность тестирования:

1. ✅ Войдите как admin
2. ✅ Создайте пользователей через админ-панель
3. ✅ Выйдите и войдите как PROJECT_MANAGER
4. ✅ Создайте проект
5. ✅ Добавьте участников в команду
6. ✅ Создайте задачи
7. ✅ Назначьте RACI роли через матрицу
8. ✅ Запросите публикацию проекта
9. ✅ Войдите как admin и одобрите проект
10. ✅ Войдите как TEAM_MEMBER и обновите статус задач
11. ✅ Проверьте Kanban drag-and-drop
12. ✅ Протестируйте темную тему

## 🚀 Production Deployment

### Backend

1. **Обновите `.env` для продакшена:**

```env
FLASK_ENV=production
SECRET_KEY=<сгенерируйте сильный ключ>
JWT_SECRET_KEY=<сгенерируйте сильный ключ>
DATABASE_URL=postgresql://user:pass@host:port/dbname
CORS_ORIGINS=https://your-frontend-domain.com
```

2. **Используйте PostgreSQL вместо SQLite:**

```bash
pip install psycopg2-binary
```

3. **Запуск с Gunicorn:**

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

4. **Настройка Nginx (reverse proxy):**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Frontend

1. **Обновите `.env.production`:**

```env
VITE_API_URL=https://api.yourdomain.com/api
```

2. **Build для продакшена:**

```bash
npm run build
```

3. **Deploy на Vercel/Netlify:**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

4. **Или используйте Nginx:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/crm-raci/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker (опционально)

Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/crm_raci
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:5000/api

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=crm_raci
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Запуск:

```bash
docker-compose up -d
```

## 🛡️ Безопасность

- ✅ JWT токены с автоматическим истечением
- ✅ Bcrypt хеширование паролей (salt rounds: 12)
- ✅ CORS защита с whitelist доменов
- ✅ Валидация всех входных данных
- ✅ Проверка прав доступа на уровне API
- ✅ Rate limiting (опционально: Flask-Limiter)
- ✅ XSS защита (React автоматически экранирует)
- ✅ CSRF защита для форм
- ✅ Аудит логирование всех критичных действий

## 📊 Мониторинг и логирование

### Backend логи:

```python
# app/__init__.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Activity logs (аудит):

Все действия пользователей логируются в таблицу `activity_logs`:

- Создание/обновление/удаление проектов
- Создание/обновление/удаление задач
- Назначение RACI ролей
- Добавление/удаление участников команды
- Одобрение/отклонение проектов

## 🐛 Известные проблемы

- [ ] Уведомления пока не работают в реальном времени (нужен WebSocket)
- [ ] Поиск работает только по названию (нужен полнотекстовый поиск)
- [ ] Нет поддержки прикрепления файлов >16MB
- [ ] Email уведомления не настроены

## 📝 TODO

- [ ] Добавить WebSocket для реального времени
- [ ] Реализовать email уведомления (SMTP)
- [ ] Добавить экспорт проектов в PDF/Excel
- [ ] Gantt диаграмма для проектов
- [ ] Комментарии и чат в задачах

---

**Разработано для эффективного управления проектами**

*Этот проект создан для демонстрации современных практик веб-разработки: микросервисная архитектура, JWT аутентификация, TypeScript, React Hooks, TanStack Query, Tailwind CSS, RACI методология.*
