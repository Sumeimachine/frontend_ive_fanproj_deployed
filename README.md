# DiveIntoIVE Frontend (Refactored)

This frontend is structured to integrate with your ASP.NET backend APIs (`/api/Auth`, `/api/User`, `/api/Admin`, `/api/Youtube`) and make page content easier to edit.

## API connection for your backend

Your API docs are at:

- `https://api.iveph.com/swagger/index.html`

For local development, this project now includes a Vite proxy:

- Frontend calls `/backend-api/*`
- Vite forwards to `https://api.iveph.com/api/*`

So if `VITE_API_URL` is not set, API calls still work in dev through the proxy.

## Environment setup

Create `.env` (or `.env.local`) with:

```bash
VITE_API_URL=https://api.iveph.com/api
```

If omitted, the app falls back to `/backend-api` (proxy mode in `vite.config.ts`).

## What changed

- Centralized HTTP client with auth token interceptor: `src/services/httpClient.ts`
- API modules per backend domain:
  - `src/services/api/authApi.ts`
  - `src/services/api/userApi.ts`
  - `src/services/api/adminApi.ts`
  - `src/services/api/youtubeApi.ts`
- Stronger auth state management in `src/context/AuthContext.tsx`
- Improved login UI + behavior in `src/components/LoginForm.tsx` and `src/pages/Login.tsx`
- Added editable page system:
  - Page templates in `src/content/pageTemplates.ts`
  - Page list in `src/pages/ContentPages.tsx`
  - Dynamic renderer in `src/pages/DynamicContentPage.tsx`
  - Simple editor in `src/pages/ContentEditor.tsx`
- Expanded routes in `src/App.tsx`
- Sidebar navigation updated in `src/layouts/MainLayout.tsx`

## Run locally

```bash
npm install
npm run dev
```

## Build and lint

```bash
npm run lint
npm run build
```

## Notes for backend integration

- Login expects backend response with at least `token`.
- If backend also returns `refreshToken`, it is stored automatically.
- Profile bootstrap calls `/User/profile` after login when `username` or `role` are absent in login response.
- Content editor currently stores data in localStorage for quick iteration and can be swapped to backend persistence later.
