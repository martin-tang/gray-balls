# 🚀 Deploying to Vercel + Prisma

This guide will help you deploy your game to Vercel with Prisma and PostgreSQL.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free)
2. A [GitHub account](https://github.com) (to connect your repo)
3. A hosted PostgreSQL database (choose one):
   - **Vercel Postgres** (easiest, integrates directly)
   - **Neon** (generous free tier)
   - **Supabase** (free tier available)
   - **Railway** ($5/month)

---

## Step 1: Prepare Your Project

### 1.1 Create `vercel.json` configuration

This file tells Vercel how to build and serve your app:

```json
{
  "buildCommand": "npm install && npx prisma generate",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 1.2 Convert Express API to Vercel Serverless Functions

Your current `api/server.js` needs to be converted to serverless functions. Create these files:

**`api/leaderboard.js`** (main endpoint):
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Serverless function handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Your existing server.js logic here...
  // GET /api/leaderboard - fetch leaderboard
  // POST /api/leaderboard - submit score
  // etc.
}
```

### 1.3 Update `package.json`

Add a build script:

```json
{
  "scripts": {
    "build": "npx prisma generate",
    "postinstall": "prisma generate"
  }
}
```

---

## Step 2: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on "Storage" tab
3. Create a new "Postgres" database
4. Copy the connection string (starts with `postgresql://`)
5. Vercel will automatically set `DATABASE_URL` environment variable

### Option B: Neon (Free Tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. You'll add this to Vercel environment variables

---

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.`

### 3.3 Add Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://username:password@host:5432/database
```

(Use the connection string from Step 2)

### 3.4 Deploy

Click "Deploy" and wait for the build to complete!

---

## Step 4: Run Database Migrations

After first deployment, you need to initialize your database:

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migration
vercel env pull .env.local
npx prisma db push
```

### Option 2: Using Prisma Data Platform

1. Go to [cloud.prisma.io](https://cloud.prisma.io)
2. Connect your database
3. Run migrations from the web interface

---

## Step 5: Update API URL in Frontend

Update the `<meta name="api-url">` tag in `index.html`:

```html
<meta name="api-url" content="https://your-app.vercel.app">
```

Or make it dynamic:

```html
<meta name="api-url" content="">
<script>
  // Auto-detect API URL
  const apiUrl = window.location.origin;
  document.querySelector('meta[name="api-url"]').setAttribute('content', apiUrl);
</script>
```

---

## 🎮 Your Game is Live!

Visit `https://your-app.vercel.app` to play!

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `castlecrasher.com`)
3. Update DNS records as instructed

---

## Troubleshooting

### "PrismaClient is unable to be run in the browser"
- Make sure `prisma generate` runs during build
- Check that `@prisma/client` is in `dependencies` (not `devDependencies`)

### "Database connection failed"
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check that the connection string is correct
- Make sure database allows connections from Vercel IPs (most hosted DBs allow all IPs by default)

### "404 on API routes"
- Check `vercel.json` routing configuration
- Make sure API files are in `/api` folder
- Restart deployment

### Cold Starts
- Serverless functions may be slow on first request (cold start)
- Consider upgrading to Vercel Pro ($20/month) for better performance
- Or use a separate backend on Railway/Render

---

## 💰 Cost Estimate

- **Vercel Hobby (Free)**: 100GB bandwidth, unlimited requests
- **Database**:
  - Vercel Postgres: $0.12/hour (~$87/month) - expensive!
  - Neon: Free tier (3GB storage) or $19/month
  - Supabase: Free tier (500MB) or $25/month
  - Railway: ~$5/month

**Recommended for production**: Vercel Free + Neon Free = $0/month to start!

---

## 📚 Useful Commands

```bash
# Test locally with Vercel dev server
vercel dev

# Deploy to preview (test before production)
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull
```

---

## Next Steps

1. Set up monitoring (Vercel Analytics is built-in)
2. Add custom domain
3. Enable Vercel Web Analytics for player tracking
4. Set up automatic deployments (deploy on every git push)

Need help? Check [Vercel Docs](https://vercel.com/docs) or [Prisma Docs](https://www.prisma.io/docs)

