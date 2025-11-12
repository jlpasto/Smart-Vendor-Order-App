# Deploying to Render

This guide explains how to deploy the Wholesale Order App to Render with a PostgreSQL database, backend API server, and frontend static site.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Git installed on your local machine

## Deployment Architecture

The app will be deployed as three separate Render services:

1. **PostgreSQL Database** - Managed database service
2. **Backend API Server** - Web service running Node.js/Express
3. **Frontend** - Static site serving the React app

## Option 1: Deploy Using Blueprint (Recommended)

### Step 1: Push Code to Git

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New" → "Blueprint"**
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"** to create all services

### Step 3: Update Service URLs

After deployment, Render will provide URLs for your services. You'll need to update these in two places:

1. **Update Frontend Environment Variable:**
   - Go to your frontend service in Render dashboard
   - Navigate to **Environment** tab
   - Update `VITE_API_URL` to your actual backend API URL (e.g., `https://wholesale-app-api.onrender.com`)

2. **Update Backend CORS:**
   - Go to your backend service in Render dashboard
   - Navigate to **Environment** tab
   - Update `FRONTEND_URL` to your actual frontend URL (e.g., `https://wholesale-app-frontend.onrender.com`)

3. **Redeploy both services** after updating the URLs

## Option 2: Manual Deployment

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New" → "PostgreSQL"**
2. Configure:
   - **Name**: `wholesale-app-db`
   - **Database**: `wholesale_app`
   - **Plan**: Free (or paid for production)
3. Click **"Create Database"**
4. Save the **Internal Database URL** (starts with `postgres://`)

### Step 2: Deploy Backend API

1. Click **"New" → "Web Service"**
2. Connect your Git repository
3. Configure:
   - **Name**: `wholesale-app-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<from database internal connection>
   DB_PORT=5432
   DB_NAME=wholesale_app
   DB_USER=<from database credentials>
   DB_PASSWORD=<from database credentials>
   JWT_SECRET=<generate a secure random string>
   FRONTEND_URL=<will add after frontend deployment>
   ENABLE_LOGIN=true
   ```

5. Click **"Create Web Service"**

### Step 3: Deploy Frontend

1. Click **"New" → "Static Site"**
2. Connect your Git repository
3. Configure:
   - **Name**: `wholesale-app-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=<your backend API URL from Step 2>
   ```

5. Click **"Create Static Site"**

### Step 4: Update Backend CORS

1. Go back to your backend service
2. Add the `FRONTEND_URL` environment variable with your frontend URL
3. Trigger a manual redeploy

## Important Configuration Notes

### Database Connection

The backend automatically connects to PostgreSQL using environment variables. The database tables will be created automatically on first run via the `initDatabase()` function in [server/config/database.js](server/config/database.js:45-166).

### Environment Variables

Render will automatically handle:
- Database credentials (auto-generated for PostgreSQL service)
- Service-to-service communication (internal URLs)
- SSL connections for database

### Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month of runtime per service
- Database storage limited to 1GB

For production apps, consider upgrading to paid plans.

## Verifying Deployment

### Check Backend API

Visit your backend URL: `https://your-api-name.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Wholesale Order App API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Check Frontend

Visit your frontend URL and verify:
- App loads correctly
- Can view products
- Can place orders (if logged in)
- No CORS errors in browser console

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Verify `FRONTEND_URL` in backend matches your actual frontend URL
2. Verify `VITE_API_URL` in frontend matches your actual backend URL
3. Redeploy both services after changing environment variables

### Database Connection Errors

If backend fails to connect to database:
1. Check database service is running
2. Verify all `DB_*` environment variables are set correctly
3. Check Render logs for specific error messages

### Build Failures

Frontend build failures:
1. Check [client/package.json](client/package.json) has all required dependencies
2. Verify build command is correct
3. Check Render build logs for specific errors

Backend build failures:
1. Check [package.json](package.json) has all required dependencies
2. Verify Node version compatibility
3. Check Render build logs

### App Not Loading

1. Check Render dashboard for service status
2. View logs for each service
3. Verify environment variables are set correctly
4. Check browser console for errors

## Updating Your Deployment

To deploy updates:

1. Push changes to your Git repository:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. Render will automatically detect the changes and redeploy (if auto-deploy is enabled)

3. Or manually trigger deployment from Render dashboard

## Custom Domain (Optional)

To use your own domain:

1. Go to your frontend service settings
2. Click **"Custom Domain"**
3. Follow instructions to add DNS records
4. Update `FRONTEND_URL` in backend environment variables
5. Redeploy backend service

## Database Backups

Free tier databases are not backed up automatically. For production:
1. Upgrade to a paid plan for automatic backups
2. Or manually export data periodically using pg_dump

## Security Recommendations

1. **Use Strong Secrets**: Generate secure random strings for `JWT_SECRET`
2. **Enable HTTPS**: Render provides SSL certificates automatically
3. **Environment Variables**: Never commit sensitive data to Git
4. **Database Access**: Use internal database URL for backend connection
5. **CORS**: Keep `FRONTEND_URL` restricted to your actual frontend domain

## Monitoring

Render provides:
- Real-time logs for all services
- Metrics dashboard (CPU, Memory, Request count)
- Email alerts for service failures

Access these from your Render dashboard.

## Cost Optimization

To minimize costs on free tier:
- Use a single database for all environments
- Set services to auto-sleep after inactivity
- Monitor usage in Render dashboard

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [Render Status Page](https://status.render.com)
