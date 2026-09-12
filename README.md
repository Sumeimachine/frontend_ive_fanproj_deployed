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

## Fan photo gallery

The public `/photo-gallery` page adds GrantSor's permitted photography alongside the existing website. Access it through **Photo Gallery** in the sidebar. The homepage, member designs, 3D experience, and Card Game remain as they were.

Seven photographs from the IVE Switch Manila fansign on July 12, 2024 are served locally as responsive WebP files, with original watermarks, visible credits, and links to the original posts. The gallery supports member filters and a keyboard-accessible photo viewer.

Photo metadata lives in `src/content/grantsor.ts`. See `public/images/grantsor/CREDITS.md` for source and permission details, and run `python scripts/sync_grantsor_photos.py` with Pillow installed to rebuild the assets. The private permission conversation is not published. Permission for this project does not grant visitors a general reuse license.

## Deployment

Vercel response headers, including the Content Security Policy and `frame-ancestors`, are configured in `vercel.json`. Keep production API origins synchronized there when domains change.
