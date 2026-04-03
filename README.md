# DiveIntoIVE Frontend (Refactored)

This frontend is now structured to integrate cleanly with your ASP.NET backend APIs (`/api/Auth`, `/api/User`, `/api/Admin`, `/api/Youtube`) and to make page content easier to edit.

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

## Environment setup

Create `.env` (or `.env.local`) with:

```bash
VITE_API_URL=https://your-backend-host/api
```

Example:

```bash
VITE_API_URL=http://localhost:5086/api
```

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
