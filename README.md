# DiveIntoIVEPH frontend

React/Vite frontend for a non-commercial IVE fan-support website. It is not an official IVE, Starship Entertainment, or merchandise project.

## Local development

```powershell
npm install
npm run dev
```

The frontend expects the API at `/backend-api` by default. Set `VITE_API_URL` when running the API at a different origin.

## Checks

```powershell
npm test
npm run lint
npm run build
```

## Routing and accounts

Member profiles, About, dashboard metrics, public content pages, fan events, and quiz leaderboards are available to guests. Daily quiz submissions, fan points, content editing, media management, and admin operations require an account with the appropriate role.

## Media optimization

Bundled member images include 480 px and 960 px AVIF/WebP variants. The login background uses WebM first with optimized MP4 fallback, a poster, and metadata-only preload. Rebuild these assets with:

```powershell
python scripts/optimize_assets.py --ffmpeg C:\path\to\ffmpeg.exe
```

The UI avoids loading the 3D member universe and autoplay video when reduced-motion or reduced-data preferences are active.

## Deployment

Vercel response headers, including the Content Security Policy and `frame-ancestors`, are configured in `vercel.json`. Keep production API origins synchronized there when domains change.
