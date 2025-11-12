# Quick Start: Deploy to Render

Follow these steps to deploy your Wholesale Order App to Render in under 10 minutes.

## Prerequisites
- Git repository with your code
- [Render account](https://render.com) (free)

## Quick Deploy Steps

### 1. Push Your Code to Git
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Set **Name**: `wholesale-app-db`
4. Set **Database**: `wholesale_app`
5. Choose **Free** plan
6. Click **"Create Database"**
7. Copy the **Internal Database URL** (you'll need this)

### 3. Deploy Backend API
1. Click **"New +"** → **"Web Service"**
2. Connect your Git repository
3. Configure:
   - **Name**: `wholesale-app-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add these Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<click "Generate" button>
   ENABLE_LOGIN=true
   FRONTEND_URL=https://wholesale-app-frontend.onrender.com
   ```

5. Add Database Variables (from Step 2):
   - Parse your Internal Database URL: `postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE`
   - Add individually:
     ```
     DB_HOST=<host from URL>
     DB_PORT=5432
     DB_NAME=wholesale_app
     DB_USER=<username from URL>
     DB_PASSWORD=<password from URL>
     ```

6. Click **"Create Web Service"**

### 4. Deploy Frontend
1. Click **"New +"** → **"Static Site"**
2. Connect your Git repository
3. Configure:
   - **Name**: `wholesale-app-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://wholesale-app-api.onrender.com
   ```
   Replace with your actual backend URL from Step 3

5. Click **"Create Static Site"**

### 5. Update URLs
After both services are deployed:

1. **Update Backend CORS**:
   - Go to backend service → Environment
   - Update `FRONTEND_URL` with your actual frontend URL
   - Click **"Save Changes"**
   - Manually redeploy backend

2. **Verify Frontend**:
   - Go to frontend service → Environment
   - Verify `VITE_API_URL` points to your backend
   - Redeploy if needed

### 6. Test Your Deployment

Visit your frontend URL and test:
- App loads correctly
- Can view products
- Can login (default: `admin@wholesalehub.com` / `admin123`)
- No CORS errors in browser console

## Troubleshooting

**CORS Errors?**
- Ensure `FRONTEND_URL` in backend matches your frontend URL exactly
- Redeploy backend after changing environment variables

**Database Connection Errors?**
- Verify all `DB_*` variables are set correctly
- Check Render logs for specific errors

**App Not Loading?**
- Wait 30-60 seconds after first deploy (free tier spins up)
- Check browser console for errors
- View Render service logs

## Default Login
```
Email: admin@wholesalehub.com
Password: admin123
```

**IMPORTANT**: Change this password in production!

## Next Steps
- Run the seed script to add sample data (optional)
- Set up a custom domain
- Configure email settings for notifications
- Monitor usage in Render dashboard

For detailed documentation, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
