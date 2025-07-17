# API Документация

## Общие положения
- **Формат**: JSON
- **Аутентификация**: JWT-токен в заголовке `Authorization: Bearer <token>`
- **Базовый URL**: `/`
- **Коды ответа**:
  - 200: Успех
  - 201: Создано
  - 400: Неверные данные
  - 403: Доступ запрещен
  - 404: Не найдено
  - 500: Внутренняя ошибка сервера

---

## Аутентификация (`/auth`)

### POST `/auth/login`
Аутентификация пользователя.
- **Тело запроса**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Ответ**:
  ```json
  {
    "access_token": "string",
    "token_type": "Bearer"
  }
  ```
- **Ошибки**: 401 (Неверные данные)

### GET `/auth/me`
Получение информации о текущем пользователе.
- **Ответ**:
  ```json
  {
    "id": int,
    "username": "string",
    "full_name": "string",
    "email": "string",
    "positions": ["string"]
  }
  ```
- **Ошибки**: 403 (Требуется токен)

### PATCH `/auth/me`
Обновление информации о текущем пользователе.
- **Тело запроса**:
  ```json
  {
    "full_name": "string",
    "phone": "string",
    "email": "string"
  }
  ```
- **Ответ**:
  ```json
  {"message": "Информация о пользователе обновлена"}
  ```
- **Ошибки**: 400 (Некорректные данные), 500 (Внутренняя ошибка)

---

## Проекты (`/projects`)

### POST `/projects/`
Создание проекта (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "title": "string",
    "description": "string",
    "deadline": "YYYY-MM-DDTHH:MM:SS"
  }
  ```
- **Ответ**:
  ```json
  {"id": int}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 500 (Внутренняя ошибка)

### PATCH `/projects/<project_id>`
Обновление проекта (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "title": "string",
    "description": "string",
    "deadline": "YYYY-MM-DDTHH:MM:SS",
    "is_archived": boolean
  }
  ```
- **Ответ**:
  ```json
  {"message": "Проект обновлен"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 404 (Проект не найден), 500 (Внутренняя ошибка)

### POST `/projects/<project_id>/archive`
Архивирование проекта (требуются права администратора).
- **Ответ**:
  ```json
  {"message": "Проект заархивирован"}
  ```
- **Ошибки**: 403 (Требуются права администратора), 404 (Проект не найден)

### POST `/projects/<project_id>/members`
Добавление участника в проект (требуются права администратора).
- **Тело запроса**:
  ```json
  {"user_id": int}
  ```
- **Ответ**:
  ```json
  {"message": "Пользователь добавлен"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 404 (Проект/пользователь не найден), 500 (Внутренняя ошибка)

### DELETE `/projects/<project_id>/members/<user_id>`
Удаление участника из проекта (требуются права администратора).
- **Ответ**:
  ```json
  {"message": "Пользователь удален"}
  ```
- **Ошибки**: 403 (Требуются права администратора), 404 (Участник не найден)

### POST `/projects/<project_id>/stages`
Создание этапа проекта (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "title": "string",
    "status": "planned|in_progress|completed",
    "deadline": "YYYY-MM-DDTHH:MM:SS",
    "sequence": int
  }
  ```
- **Ответ**:
  ```json
  {"id": int}
  ```
- **Ошибки**: 403 (Требуются права администратора), 404 (Проект не найден), 500 (Внутренняя ошибка)

### PATCH `/projects/<project_id>/stages/<stage_id>`
Обновление этапа проекта (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "title": "string",
    "status": "planned|in_progress|completed",
    "deadline": "YYYY-MM-DDTHH:MM:SS",
    "sequence": int
  }
  ```
- **Ответ**:
  ```json
  {"message": "Этап обновлен"}
  ```
- **Ошибки**: 403 (Требуются права администратора), 404 (Этап не найден), 500 (Внутренняя ошибка)

### GET `/projects/`
Получение списка проектов текущего пользователя.
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "title": "string",
      "description": "string",
      "created_by": int,
      "deadline": "string",
      "is_archived": boolean
    }
  ]
  ```
- **Ошибки**: 403 (Требуется токен)

### GET `/projects/<project_id>/members`
Получение списка участников проекта.
- **Ответ**:
  ```json
  [
    {
      "user_id": int,
      "username": "string",
      "full_name": "string"
    }
  ]
  ```
- **Ошибки**: 403 (Доступ закрыт), 404 (Проект не найден)

### GET `/projects/<project_id>/stages`
Получение списка этапов проекта.
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "title": "string",
      "status": "string",
      "deadline": "string",
      "sequence": int
    }
  ]
  ```
- **Ошибки**: 403 (Доступ закрыт), 404 (Проект не найден)

### GET `/projects/dashboard`
Получение данных для дашборда.
- **Ответ**:
  ```json
  {
    "projects": [
      {
        "id": int,
        "title": "string",
        "total_tasks": int,
        "completed_tasks": int,
        "progress": float,
        "is_archived": boolean
      }
    ],
    "unread_notifications": int,
    "total_incomplete_tasks": int
  }
  ```
- **Ошибки**: 403 (Требуется токен)

### GET `/projects/roles`
Получение списка ролей.
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "title": "string",
      "is_custom": boolean
    }
  ]
  ```
- **Ошибки**: 403 (Требуется токен)

---

## Уведомления (`/notifications`)

### GET `/notifications/notifications`
Получение списка уведомлений текущего пользователя.
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "message": "string",
      "is_read": boolean,
      "related_entity": "project|stage|task",
      "related_entity_id": int,
      "created_at": "string"
    }
  ]
  ```
- **Ошибки**: 403 (Требуется токен)

---

## Администрирование (`/admin`)

### GET `/admin/users`
Получение списка пользователей (требуются права администратора).
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "username": "string",
      "full_name": "string",
      "email": "string",
      "is_active": boolean,
      "positions": ["string"]
    }
  ]
  ```
- **Ошибки**: 403 (Требуются права администратора)

### POST `/admin/users`
Создание пользователя (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "username": "string",
    "password": "string",
    "full_name": "string",
    "phone": "string",
    "email": "string",
    "is_active": boolean
  }
  ```
- **Ответ**:
  ```json
  {
    "message": "string",
    "id": int
  }
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 500 (Внутренняя ошибка)

### PATCH `/admin/users/<user_id>`
Обновление пользователя (требуются права администратора).
- **Тело запроса**:
  ```json
  {
    "username": "string",
    "full_name": "string",
    "phone": "string",
    "email": "string",
    "is_active": boolean,
    "new_password": "string"
  }
  ```
- **Ответ**:
  ```json
  {"message": "Пользователь обновлен"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 404 (Пользователь не найден), 500 (Внутренняя ошибка)

### GET `/admin/users/<user_id>`
Получение информации о пользователе (требуются права администратора).
- **Ответ**:
  ```json
  {
    "id": int,
    "username": "string",
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "is_active": boolean,
    "positions": ["string"],
    "created_at": "string",
    "updated_at": "string"
  }
  ```
- **Ошибки**: 403 (Требуются права администратора), 404 (Пользователь не найден)

### POST `/admin/roles`
Создание роли (требуются права администратора).
- **Тело запроса**:
  ```json
  {"title": "string"}
  ```
- **Ответ**:
  ```json
  {
    "message": "Роль создана",
    "id": int
  }
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 500 (Внутренняя ошибка)

### POST `/admin/positions`
Создание должности (требуются права администратора).
- **Тело запроса**:
  ```json
  {"title": "string"}
  ```
- **Ответ**:
  ```json
  {
    "message": "Должность создана",
    "id": int
  }
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Требуются права администратора), 500 (Внутренняя ошибка)

---

## Задачи (`/tasks`)

### POST `/tasks/`
Создание задачи.
- **Тело запроса**:
  ```json
  {
    "stage_id": int,
    "title": "string",
    "description": "string",
    "priority": "low|medium|high",
    "is_completed": boolean,
    "deadline": "YYYY-MM-DDTHH:MM:SS"
  }
  ```
- **Ответ**:
  ```json
  {"id": int}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Доступ закрыт), 404 (Этап не найден), 500 (Внутренняя ошибка)

### GET `/tasks/`
Получение списка задач (фильтры: `stage_id`, `project_id`).
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "title": "string",
      "stage_id": int,
      "priority": "string",
      "is_completed": boolean,
      "deadline": "string",
      "depends_on_tasks": [int]
    }
  ]
  ```
- **Ошибки**: 403 (Доступ закрыт)

### PUT `/tasks/<task_id>/raci`
Обновление RACI-матрицы задачи (требуются права администратора или создателя проекта).
- **Тело запроса**:
  ```json
  {
    "assignments": [
      {
        "user_id": int,
        "role_id": int
      }
    ]
  }
  ```
- **Ответ**:
  ```json
  {"message": "RACI матрица обновлена"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Доступ закрыт), 404 (Задача не найдена), 500 (Внутренняя ошибка)

### GET `/tasks/<task_id>/raci`
Получение RACI-матрицы задачи.
- **Ответ**:
  ```json
  [
    {
      "user_id": int,
      "username": "string",
      "role": "string"
    }
  ]
  ```
- **Ошибки**: 403 (Доступ закрыт), 404 (Задача не найдена)

### PATCH `/tasks/<task_id>/status`
Обновление статуса задачи (требуются права администратора или R/A роли).
- **Тело запроса**:
  ```json
  {"is_completed": boolean}
  ```
- **Ответ**:
  ```json
  {"message": "Статус задачи обновлен"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Доступ закрыт), 404 (Задача не найдена), 500 (Внутренняя ошибка)

### GET `/tasks/<task_id>/dependencies`
Получение зависимостей задачи.
- **Ответ**:
  ```json
  [
    {
      "id": int,
      "title": "string"
    }
  ]
  ```
- **Ошибки**: 403 (Доступ закрыт), 404 (Задача не найдена)

### PUT `/tasks/<task_id>/dependencies`
Обновление зависимостей задачи (требуются права администратора или A-роль).
- **Тело запроса**:
  ```json
  {"dependencies": [int]}
  ```
- **Ответ**:
  ```json
  {"message": "Зависимости задачи обновлены"}
  ```
- **Ошибки**: 400 (Некорректные данные), 403 (Доступ закрыт), 404 (Задача не найдена), 500 (Внутренняя ошибка)