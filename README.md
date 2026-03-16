# Frontend README

## Overview

The frontend is a React 19 + TypeScript single-page application built with Vite. It is responsible for user login, password setup, chat interaction, knowledge base management UI, and admin user management.

The frontend does not embed business logic for retrieval or ingestion. It orchestrates browser state and talks to the FastAPI backend over REST plus SSE.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives

## Routing and Page Map

The router is defined in [`frontend/src/main.tsx`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/main.tsx) and hands all routes to [`frontend/src/App.tsx`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/App.tsx).

Runtime route behavior:

- `/`
  - unauthenticated users see the login page
  - authenticated non-admin users see the chat shell
  - authenticated admins are redirected to `/admin`
- `/setup-password`
  - validates a password setup token and lets the user set an initial password
- In-app sections handled inside `App.tsx`
  - chat
  - knowledge base
  - admin

`App.tsx` is the frontend orchestration layer. It handles:

- auth restoration from `localStorage`
- profile refresh through `/auth/me` when needed
- route gating
- session hydration from the backend
- local session selection and deletion state

## Environment Variables

The frontend expects a `.env` file based on [`frontend/.env.example`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/.env.example).

### `VITE_API_BASE_URL`

- Example: `http://localhost:8000`
- Required: yes
- Used by [`frontend/src/lib/api.ts`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/lib/api.ts) to build absolute backend URLs

Important behavior:

- If `VITE_API_BASE_URL` is missing, the frontend throws immediately at startup.
- Fetch helpers use the explicit API base URL, not a relative browser path.
- The chat `EventSource` also uses the explicit API base URL and appends the JWT as a `token` query parameter.

## Local Development

### Install dependencies

```bash
cd frontend
npm install
```

### Create `.env`

```bash
cd frontend
cp .env.example .env
```

Set:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

### Run the dev server

```bash
cd frontend
npm run dev
```

The Vite dev server listens on port `8080`.

### Build, preview, and lint

```bash
cd frontend
npm run build
npm run preview
npm run lint
```

## Dev Server and Backend Integration

[`frontend/vite.config.ts`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/vite.config.ts) defines:

- Vite dev port `8080`
- alias `@ -> ./src`
- proxy for `/api` to `http://127.0.0.1:8000`

Operationally, the frontend still relies on `VITE_API_BASE_URL` for its fetch helper. The proxy is helpful during local browser development, but it does not replace the need to configure `VITE_API_BASE_URL` correctly.

Current backend assumptions:

- backend is running separately
- backend is reachable from the browser at the configured API base URL
- SSE endpoint accepts JWT via query param because browser `EventSource` cannot set custom headers

## Auth Handling

### Login flow

1. The user submits username and password on the login page.
2. The frontend calls `POST /auth/token`.
3. On success, it stores the JWT and user profile in `localStorage` under `kijangBotUser`.
4. The in-memory app state is updated from that stored auth object.

### Auth restoration flow

1. On app load, the frontend checks `localStorage`.
2. If no stored user exists, it shows the login page.
3. If the stored shape already contains role/access flags, it trusts that object.
4. If the stored shape is older, it calls `GET /auth/me` with the stored token to refresh the profile.
5. If `/auth/me` fails, the frontend clears local storage and returns to login.

### Password setup flow

1. The user opens `/setup-password?token=...`.
2. The page calls `POST /auth/setup-password/validate`.
3. If valid, the frontend shows the password form and displays the username.
4. On submit, the page calls `POST /auth/setup-password`.
5. After success, the frontend redirects to `/`.

## Session Handling

The frontend session model is intentionally lightweight and uses client-generated ids until the backend persists them.

### Session hydration

1. After login, non-admin users call `GET /api/sessions/{username}`.
2. The backend returns a legacy thread structure.
3. The frontend transforms those threads into local `Session` objects.
4. Session names are derived from the first user message, or `New Conversation` when empty.

### New conversations

1. Clicking new conversation creates a local empty session immediately.
2. The frontend generates a UUID in the browser.
3. The backend does not persist anything until the first message is sent.

### Session deletion

1. The frontend calls `DELETE /api/sessions/{username}/{session_id}`.
2. If the backend returns success, or even `404`, the frontend removes the session locally.
3. If no sessions remain, the frontend creates a fresh empty session.

## UI-to-Backend Integration

### API helper

[`frontend/src/lib/api.ts`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/lib/api.ts) normalizes `VITE_API_BASE_URL` and generates absolute URLs for all requests.

### User profile mapping

[`frontend/src/lib/auth.ts`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/lib/auth.ts) maps backend snake_case fields into the frontend `AuthUser` shape:

- `is_admin -> isAdmin`
- `is_kb_maintainer -> isKbMaintainer`
- `can_access_chat -> canAccessChat`
- `can_access_kb -> canAccessKb`
- `can_manage_kb -> canManageKb`

This mapping drives route gating and feature visibility.

## Feature Behavior

### 1. Login

- endpoint used: `POST /auth/token`
- persisted state: `localStorage["kijangBotUser"]`
- fallback profile refresh: `GET /auth/me`
- admin users are redirected to the admin page
- non-admin users stay in the chat application

### 2. Chat

The chat surface is implemented primarily in [`frontend/src/components/chat-box.tsx`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/components/chat-box.tsx).

Runtime behavior:

1. When a chat session is selected, the component opens one `EventSource` for that `user_id` and `session_id`.
2. The URL is `/api/chat/events/{user_id}/{session_id}?token=<jwt>`.
3. When the user sends a message, the frontend:
   - appends a user message locally
   - appends an empty bot placeholder locally
   - posts the payload to `POST /api/chat/message`
4. As `ModelResponse` events arrive, the frontend updates the bot placeholder content incrementally.
5. When `ModelResponseEnd` arrives, it stops the typing state.
6. Citations from SSE metadata are stored in `message.metadata.citations`.

Important current behavior:

- there is one live `EventSource` per active chat view
- stopping streaming in the UI only resets local state; it does not cancel backend generation
- SSE errors end the current typing state and leave the last partial content in place

### 3. Knowledge Base

The page is implemented in [`frontend/src/pages/knowledge-base.tsx`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/pages/knowledge-base.tsx).

Runtime behavior:

- fetches documents from `GET /api/kb/documents`
- transforms backend dates from `YYYYMMDD` into ISO strings for display
- uploads files via `POST /api/kb/upload_documents` using `multipart/form-data`
- deletes documents via `DELETE /api/kb/documents/{doc_id}`

Permissions:

- any authenticated user can list documents
- only users with `canManageKb` can upload or delete

Current frontend validation:

- allowed file extensions in the UI: `txt`, `pdf`, `csv`
- max file size: 10 MB

Note:

- the backend also supports `md`, but the current file picker UI does not advertise or validate for that extension

### 4. Admin

The page is implemented in [`frontend/src/pages/admin-page.tsx`](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/pages/admin-page.tsx).

Runtime behavior:

- lists users from `GET /api/admin/users`
- creates users with `POST /api/admin/users`
- toggles KB maintainer access with `PATCH /api/admin/users/{user_id}`
- regenerates setup links with `POST /api/admin/users/{user_id}/setup-link`
- surfaces the generated setup link for copy/share

Permissions:

- only admin users can access the page
- non-admin users navigating to `/admin` are redirected away

## DevOps Notes

- The frontend is not self-contained. The backend must already be running.
- The backend should usually be reachable at `http://127.0.0.1:8000` or `http://localhost:8000` during development.
- If backend auth succeeds but later requests fail, verify that `VITE_API_BASE_URL` points to the same backend instance that issued the JWT.
- Because chat uses `EventSource`, the token is currently passed as a query parameter to the SSE endpoint.

## Troubleshooting

### The frontend crashes immediately on startup

Check `VITE_API_BASE_URL`. The app throws if it is missing.

### Login works but sessions never load

Check:

- backend is running
- `VITE_API_BASE_URL` points to the correct backend
- the JWT is still valid
- `/api/sessions/{username}` is returning `200` and not `401` or `403`

### Knowledge base list loads but uploads fail

Possible causes:

- the logged-in user lacks `canManageKb`
- the file type is not accepted by the frontend
- the backend embedding endpoint is failing during ingestion

### SSE chat stream does not work

Check:

- the browser can reach `GET /api/chat/events/{user_id}/{session_id}`
- the `token` query parameter is present
- the user is not an admin
- any reverse proxy in front of the backend supports `text/event-stream`

### Confusion between proxy and API base URL

Remember:

- the Vite dev proxy forwards `/api` in local dev
- the app's fetch helper still builds absolute URLs from `VITE_API_BASE_URL`
- setting the proxy alone is not enough if `VITE_API_BASE_URL` is wrong
