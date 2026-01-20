# Task Manager

Full-stack task management app with React + Vite on the client and Node/Express + MongoDB on the server. Login uses an AWS Lambda function behind API Gateway, while registration and protected APIs run on the Express server.

## Setup

### Server

1) Install dependencies:
```bash
cd server
npm install
```

2) Create `server/.env`:
```bash
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/task_manager
JWT_SECRET=change_me
ALLOW_ADMIN_REG=false
```

3) Run the API:
```bash
npm run dev
```

### Client

1) Install dependencies:
```bash
cd client
npm install
```

2) Create `client/.env`:
```bash
VITE_API_URL=http://localhost:5000
VITE_LAMBDA_LOGIN_URL=https://<api-id>.execute-api.<region>.amazonaws.com/default/Myfunction
```

3) Run the UI:
```bash
npm run dev
```

## Environment Variables

### Server (`server/.env`)
- `PORT`: API port.
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret for signing/verifying JWTs. Must match Lambda.
- `ALLOW_ADMIN_REG`: Set `true` temporarily to register an ADMIN.

### Client (`client/.env`)
- `VITE_API_URL`: Express API base URL.
- `VITE_LAMBDA_LOGIN_URL`: API Gateway endpoint for Lambda login.

### Lambda
- `MONGODB_URI`: Same Atlas connection string.
- `JWT_SECRET`: Same value as the Express server.

## Lambda Login Flow

- Client login page calls API Gateway.
- Lambda validates credentials against MongoDB and returns `{ token, user }`.
- Client stores `token` and `user` in `localStorage`.
- Client uses `token` for all Express API calls.

## Implemented Features

- Auth: register (Express) and login (Lambda), JWT-protected routes.
- Admin team management: list/add/delete users.
- Boards: create, rename, delete, manage members (admin only).
- Tasks: create, filter, edit, delete (admin only delete).
- Column board view with status lanes and priority badges.
- Task title suggestions (mocked AI service).

## Potential Improvements

- Real AI integration for title suggestion.
- Populate assignee details in task responses.
- Better UI styling and reusable components.
- Audit trail viewer for activity logs.
- Server-side pagination for lists.
