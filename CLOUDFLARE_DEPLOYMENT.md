# SRMPlanner - Cloudflare Pages Deployment Guide

## Overview
SRMPlanner is now configured for deployment on **Cloudflare Pages** with a **Cloudflare Worker backend**.

## Prerequisites
- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Backend running on Cloudflare Workers at `https://srm-worker.goelaarav290.workers.dev`

## Deployment Steps

### 1. Connect GitHub Repository
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** > **Create a project**
3. Select **Connect to Git**
4. Authorize GitHub and select your `SRMPlanner` repository

### 2. Configure Build Settings
When creating the Pages project, use these settings:

**Framework preset:** Next.js  
**Build command:** `npm run build`  
**Build output directory:** `.next`  
**Node version:** 18.x or higher

### 3. Set Environment Variables
In the Cloudflare Pages project settings:

1. Go to **Settings** > **Environment variables**
2. Add the following for both **Production** and **Preview**:

```
NEXT_PUBLIC_SRM_BACKEND_URL=https://srm-worker.goelaarav290.workers.dev
SRM_BACKEND_URL=https://srm-worker.goelaarav290.workers.dev
```

### 4. Deploy
Push to your GitHub repository:
```bash
git add .
git commit -m "Migrate to Cloudflare Pages"
git push origin main
```

Cloudflare Pages will automatically build and deploy when you push.

## Architecture

```
┌─────────────────────────────────────────┐
│     Cloudflare Pages (Frontend)         │
│  SRMPlanner Next.js Application         │
│  - Timetable, Attendance, Marks, etc    │
└──────────────────┬──────────────────────┘
                   │ API Calls
                   ↓
┌─────────────────────────────────────────┐
│   Cloudflare Worker (Backend)           │
│  https://srm-worker.../                 │
│  - Authentication                       │
│  - Session Management                   │
│  - Web Scraper for SRM Academia         │
└─────────────────────────────────────────┘
```

## Features Configured

✅ **Icon:** `/public/srmplanner-icon.jpg` - Modern SRMPlanner icon  
✅ **Branding:** "SRMPlanner" throughout the app  
✅ **Backend:** Cloudflare Worker integration  
✅ **No Vercel:** All Vercel dependencies removed  
✅ **Analytics:** Removed (can be added via Cloudflare Analytics)  
✅ **Environment Variables:** Configured for Cloudflare Pages  

## Testing Locally

Before deploying, test locally:

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000` and verify:
- Login with SRM credentials
- All dashboard sections load correctly
- Data fetches from Cloudflare Worker backend

## Troubleshooting

### Build Fails
- Ensure Node version is 18+
- Check that all dependencies are installed: `npm install`
- Verify environment variables are set correctly

### API Calls Fail
- Confirm Cloudflare Worker is running and accessible
- Check CORS headers on Worker backend
- Verify `NEXT_PUBLIC_SRM_BACKEND_URL` is set in Pages environment

### Token Expired
- Tokens have a 60-minute TTL
- User will need to re-login after expiration
- This is handled automatically in the app

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

## Support

For issues with:
- **Frontend:** Check browser console (F12)
- **Backend:** Check Cloudflare Worker logs
- **Deployment:** Review Cloudflare Pages build logs

---

**Last Updated:** 2024  
**Frontend:** Next.js 16, Cloudflare Pages  
**Backend:** Cloudflare Workers  
**Status:** Ready for Production
