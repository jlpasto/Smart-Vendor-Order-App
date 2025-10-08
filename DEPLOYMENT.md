# 🚀 Deployment Guide - Wholesale Order App

Complete step-by-step guide to deploy your Progressive Web App to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, complete these tasks:

- [ ] **Test app locally** - Verify all features work (products, cart, orders, admin)
- [ ] **Enable authentication** - Set `ENABLE_LOGIN=true` in `.env`
- [ ] **Change JWT secret** - Update `JWT_SECRET` to a random 32+ character string
- [ ] **Test with authentication** - Sign up, login, and test all flows
- [ ] **Add custom logo** - Replace PWA icons (optional, see `client/public/LOGO_INSTRUCTIONS.md`)
- [ ] **Update branding** - Change colors in `client/tailwind.config.js` (optional)
- [ ] **Test email notifications** - Add SMTP credentials to `.env` (optional)
- [ ] **Add real products** - Use admin panel to add your actual products
- [ ] **Review database** - Check sample data is appropriate or delete test orders
- [ ] **Create GitHub repository** - Push your code to GitHub (required for most platforms)

---

## 🎯 Choose Your Deployment Option

### Quick Comparison:

| Platform | Difficulty | Cost (Est.) | Best For |
|----------|-----------|-------------|----------|
| **Option A: Render** | ⭐ Easy | ~$12/mo | Beginners, quick setup |
| **Option B: Vercel + Railway** | ⭐⭐ Medium | ~$8/mo | Best performance, scaling |
| **Option C: VPS (DigitalOcean)** | ⭐⭐⭐ Hard | ~$6/mo | Full control, learning |

---

## 🟢 Option A: Deploy to Render (Recommended for Beginners)

### Why Render?
- All-in-one platform (backend + database + frontend)
- Automatic HTTPS
- Easy setup, free database
- Great for small to medium apps

### A1. Setup GitHub Repository

- [ ] Create new GitHub repository (public or private)
- [ ] Push your code:
```bash
git init
git add .
git commit -m "Initial commit - Wholesale Order App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wholesale-app.git
git push -u origin main
```

### A2. Deploy Database on Render

- [ ] Go to [Render.com](https://render.com) and sign up
- [ ] Click **"New +"** → **"PostgreSQL"**
- [ ] Configure database:
  - **Name**: `wholesale-app-db`
  - **Database**: `wholesale_app`
  - **User**: `postgres` (auto-filled)
  - **Region**: Choose closest to your location
  - **Plan**: **Free** (or Starter $7/mo for better performance)
- [ ] Click **"Create Database"**
- [ ] **IMPORTANT**: Copy the **Internal Database URL** (starts with `postgresql://`)
- [ ] Wait for database to become available (shows "Available" status)

### A3. Deploy Backend on Render

- [ ] Click **"New +"** → **"Web Service"**
- [ ] Connect your GitHub account
- [ ] Select your repository: `wholesale-app`
- [ ] Configure service:
  - **Name**: `wholesale-app-backend`
  - **Region**: Same as database
  - **Branch**: `main`
  - **Root Directory**: Leave empty
  - **Runtime**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: **Free** (or Starter $7/mo)

- [ ] Add Environment Variables (click **"Advanced"** → **"Add Environment Variable"**):

```
DB_HOST=<from Internal Database URL - hostname part>
DB_PORT=5432
DB_NAME=wholesale_app
DB_USER=<from Internal Database URL - username>
DB_PASSWORD=<from Internal Database URL - password>
PORT=5000
NODE_ENV=production
JWT_SECRET=<generate random 32+ char string>
ENABLE_LOGIN=true
FRONTEND_URL=https://your-app-name.onrender.com
EMAIL_HOST=<your SMTP host - optional>
EMAIL_PORT=587
EMAIL_USER=<your email - optional>
EMAIL_PASSWORD=<your email password - optional>
```

**How to extract from Internal Database URL:**
```
postgresql://USERNAME:PASSWORD@HOSTNAME:5432/DATABASE
```

- [ ] Click **"Create Web Service"**
- [ ] Wait for deployment (5-10 minutes)
- [ ] Once deployed, copy the **Service URL** (e.g., `https://wholesale-app-backend.onrender.com`)

### A4. Seed Production Database

- [ ] In Render dashboard, open your backend service
- [ ] Click **"Shell"** tab (opens terminal)
- [ ] Run seed command:
```bash
npm run seed
```
- [ ] Verify output shows admin user and products created

### A5. Deploy Frontend on Render

- [ ] Click **"New +"** → **"Static Site"**
- [ ] Select same GitHub repository
- [ ] Configure:
  - **Name**: `wholesale-app-frontend`
  - **Branch**: `main`
  - **Root Directory**: `client`
  - **Build Command**: `npm install && npm run build`
  - **Publish Directory**: `client/dist`

- [ ] Add Environment Variable:
```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

- [ ] Click **"Create Static Site"**
- [ ] Wait for build and deployment

### A6. Update Backend CORS

- [ ] Go to backend service on Render
- [ ] Update `FRONTEND_URL` environment variable to your frontend URL:
```
FRONTEND_URL=https://your-frontend-name.onrender.com
```
- [ ] Service will auto-redeploy

### A7. Test Production App

- [ ] Open your frontend URL: `https://your-frontend-name.onrender.com`
- [ ] Test features:
  - [ ] Products load correctly
  - [ ] Can add to cart
  - [ ] Can submit orders
  - [ ] Admin login works (admin@wholesalehub.com / admin123)
  - [ ] Admin can manage products/orders

### A8. Configure Custom Domain (Optional)

- [ ] Purchase domain (Namecheap, Google Domains, etc.)
- [ ] In Render, go to your frontend service
- [ ] Click **"Settings"** → **"Custom Domain"**
- [ ] Add your domain and follow DNS instructions
- [ ] Update `FRONTEND_URL` in backend environment variables

---

## 🔵 Option B: Deploy to Vercel + Railway (Best Performance)

### Why This Combo?
- Vercel: Best frontend hosting (fast, global CDN)
- Railway: Easy backend + database
- Great for scaling

### B1. Deploy Database on Railway

- [ ] Go to [Railway.app](https://railway.app) and sign up with GitHub
- [ ] Click **"New Project"** → **"Provision PostgreSQL"**
- [ ] Railway creates database automatically
- [ ] Click on PostgreSQL service
- [ ] Go to **"Variables"** tab
- [ ] Copy these values:
  - `PGHOST`
  - `PGPORT`
  - `PGUSER`
  - `PGPASSWORD`
  - `PGDATABASE`

### B2. Deploy Backend on Railway

- [ ] In Railway, click **"New"** → **"GitHub Repo"**
- [ ] Select your repository
- [ ] Railway auto-detects Node.js
- [ ] Click **"Add Variables"**
- [ ] Add environment variables:

```
DB_HOST=<PGHOST from database>
DB_PORT=<PGPORT from database>
DB_NAME=<PGDATABASE from database>
DB_USER=<PGUSER from database>
DB_PASSWORD=<PGPASSWORD from database>
PORT=5000
NODE_ENV=production
JWT_SECRET=<random 32+ character string>
ENABLE_LOGIN=true
FRONTEND_URL=https://your-app.vercel.app
EMAIL_HOST=<optional>
EMAIL_PORT=587
EMAIL_USER=<optional>
EMAIL_PASSWORD=<optional>
```

- [ ] Click **"Deploy"**
- [ ] Once deployed, go to **"Settings"** → **"Networking"**
- [ ] Click **"Generate Domain"**
- [ ] Copy the domain (e.g., `your-app.up.railway.app`)

### B3. Seed Railway Database

- [ ] In your backend service, click **"Deploy Logs"**
- [ ] Look for "Build succeeded"
- [ ] Open terminal on your local machine
- [ ] Set DATABASE_URL environment variable:
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB"

# Mac/Linux
export DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB"
```
- [ ] Run seed:
```bash
npm run seed
```

**OR** use Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run seed
railway run npm run seed
```

### B4. Deploy Frontend on Vercel

- [ ] Go to [Vercel.com](https://vercel.com) and sign up with GitHub
- [ ] Click **"Add New Project"**
- [ ] Import your GitHub repository
- [ ] Configure:
  - **Framework Preset**: Vite
  - **Root Directory**: `client`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

- [ ] Add Environment Variable:
```
VITE_API_URL=https://your-backend.up.railway.app
```

- [ ] Click **"Deploy"**
- [ ] Wait for deployment
- [ ] Copy your Vercel URL (e.g., `your-app.vercel.app`)

### B5. Update Backend CORS

- [ ] Go back to Railway
- [ ] Update `FRONTEND_URL` variable:
```
FRONTEND_URL=https://your-app.vercel.app
```
- [ ] Backend will auto-redeploy

### B6. Test Production App

- [ ] Open Vercel URL
- [ ] Test all features (same as Option A7)
- [ ] Verify API calls work
- [ ] Test admin features

### B7. Custom Domain (Optional)

**Vercel:**
- [ ] Go to project settings
- [ ] Click **"Domains"**
- [ ] Add your domain
- [ ] Update DNS records

**Railway:**
- [ ] Go to backend service
- [ ] Click **"Settings"** → **"Networking"**
- [ ] Add custom domain
- [ ] Update DNS records

---

## 🟣 Option C: VPS Deployment (DigitalOcean/Linode/AWS)

### Why VPS?
- Full control over server
- Learn DevOps skills
- More complex but powerful

### C1. Create VPS Server

- [ ] Sign up for [DigitalOcean](https://digitalocean.com) / [Linode](https://linode.com) / AWS
- [ ] Create new Droplet/Instance:
  - **OS**: Ubuntu 22.04 LTS
  - **Size**: Basic $6/mo (1GB RAM)
  - **Region**: Closest to your users
  - **Authentication**: SSH key (recommended) or password

- [ ] Note your server IP address

### C2. Initial Server Setup

SSH into your server:
```bash
ssh root@YOUR_IP_ADDRESS
```

- [ ] Update system:
```bash
apt update && apt upgrade -y
```

- [ ] Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v  # Verify
```

- [ ] Install PostgreSQL:
```bash
apt install -y postgresql postgresql-contrib
```

- [ ] Install Nginx (web server):
```bash
apt install -y nginx
```

- [ ] Install PM2 (process manager):
```bash
npm install -g pm2
```

### C3. Setup PostgreSQL

- [ ] Switch to postgres user:
```bash
su - postgres
psql
```

- [ ] Create database and user:
```sql
CREATE DATABASE wholesale_app;
CREATE USER wholesale_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wholesale_app TO wholesale_user;
\q
```

- [ ] Exit postgres user:
```bash
exit
```

### C4. Clone and Setup Application

- [ ] Install Git:
```bash
apt install -y git
```

- [ ] Clone your repository:
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/wholesale-app.git
cd wholesale-app
```

- [ ] Create production `.env`:
```bash
nano .env
```

Paste:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wholesale_app
DB_USER=wholesale_user
DB_PASSWORD=your_secure_password
PORT=5000
NODE_ENV=production
JWT_SECRET=your_random_32plus_character_secret
ENABLE_LOGIN=true
FRONTEND_URL=http://YOUR_IP_ADDRESS
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
```

Press `Ctrl+O`, `Enter`, then `Ctrl+X`

- [ ] Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

- [ ] Build frontend:
```bash
cd client
npm run build
cd ..
```

- [ ] Seed database:
```bash
npm run seed
```

### C5. Setup PM2 to Run Backend

- [ ] Start backend with PM2:
```bash
pm2 start server/index.js --name wholesale-backend
pm2 save
pm2 startup
```

- [ ] Copy and run the command PM2 gives you (starts with `sudo`)

- [ ] Verify running:
```bash
pm2 status
```

### C6. Configure Nginx

- [ ] Create Nginx config:
```bash
nano /etc/nginx/sites-available/wholesale-app
```

Paste:
```nginx
server {
    listen 80;
    server_name YOUR_IP_ADDRESS;  # Or your domain

    # Serve frontend
    location / {
        root /var/www/wholesale-app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Press `Ctrl+O`, `Enter`, then `Ctrl+X`

- [ ] Enable site:
```bash
ln -s /etc/nginx/sites-available/wholesale-app /etc/nginx/sites-enabled/
```

- [ ] Test Nginx config:
```bash
nginx -t
```

- [ ] Restart Nginx:
```bash
systemctl restart nginx
```

### C7. Setup SSL with Let's Encrypt (Optional but Recommended)

- [ ] Point your domain to server IP (DNS A record)
- [ ] Install Certbot:
```bash
apt install -y certbot python3-certbot-nginx
```

- [ ] Get SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- [ ] Certbot will auto-configure Nginx for HTTPS

### C8. Setup Firewall

- [ ] Configure UFW:
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### C9. Test Production App

- [ ] Open browser: `http://YOUR_IP_ADDRESS` (or your domain)
- [ ] Test all features
- [ ] Check PM2 logs if issues:
```bash
pm2 logs wholesale-backend
```

### C10. Setup Auto-Deployment (Optional)

Create deploy script:
```bash
nano /var/www/wholesale-app/deploy.sh
```

Paste:
```bash
#!/bin/bash
cd /var/www/wholesale-app
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart wholesale-backend
```

- [ ] Make executable:
```bash
chmod +x /var/www/wholesale-app/deploy.sh
```

- [ ] To deploy updates:
```bash
/var/www/wholesale-app/deploy.sh
```

---

## 🔒 Production Security Checklist

After deployment, secure your app:

- [ ] **Enable authentication** - `ENABLE_LOGIN=true`
- [ ] **Change default passwords** - Admin password via database
- [ ] **Use HTTPS** - SSL certificate installed
- [ ] **Strong JWT secret** - Random 32+ characters
- [ ] **Firewall enabled** - Only necessary ports open
- [ ] **Database password** - Strong, unique password
- [ ] **Environment variables** - Never commit `.env` to git
- [ ] **CORS configured** - Only allow your frontend domain
- [ ] **Rate limiting** - Add rate limiting to API (optional)
- [ ] **Database backups** - Set up automated backups
- [ ] **Monitor logs** - Check logs regularly for errors
- [ ] **Update dependencies** - Keep packages up to date

---

## ✅ Post-Deployment Testing Checklist

Test everything in production:

### User Features:
- [ ] Homepage loads
- [ ] Products page displays all products
- [ ] Search works
- [ ] Filters work (vendor, state, category, popular, new)
- [ ] Favorites (star) work
- [ ] Add to cart works
- [ ] Cart persists on refresh
- [ ] Cart quantity updates work
- [ ] Submit order works
- [ ] Order confirmation shown
- [ ] Email received (if configured)
- [ ] Orders page shows history
- [ ] Orders grouped by month
- [ ] Date filter works
- [ ] Batch details expand/collapse
- [ ] PDF download works

### Admin Features:
- [ ] Admin login works
- [ ] Dashboard shows stats
- [ ] Recent orders display
- [ ] Orders management page loads
- [ ] Can filter orders
- [ ] Can update order status
- [ ] Can add admin notes
- [ ] Email sent on status update (if configured)
- [ ] Products management page loads
- [ ] Can add new product
- [ ] Can edit product
- [ ] Can delete product
- [ ] Product images load

### PWA Features:
- [ ] App installable on mobile (iOS Safari)
- [ ] App installable on mobile (Android Chrome)
- [ ] Works offline (after install)
- [ ] Icon shows on home screen
- [ ] Opens without browser chrome

### Performance:
- [ ] Page load < 3 seconds
- [ ] API responses < 1 second
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Works on different browsers

---

## 📱 Mobile App Deployment (Optional)

Convert your PWA to native mobile apps:

### Option 1: PWABuilder (Easiest)

- [ ] Go to [PWABuilder.com](https://pwabuilder.com)
- [ ] Enter your production URL
- [ ] Click "Build My PWA"
- [ ] Generate packages for iOS and Android
- [ ] Submit to app stores

### Option 2: Capacitor (Full Native)

- [ ] Install Capacitor:
```bash
cd client
npm install @capacitor/core @capacitor/cli
npx cap init
```

- [ ] Add platforms:
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

- [ ] Build and sync:
```bash
npm run build
npx cap sync
```

- [ ] Open in Android Studio / Xcode:
```bash
npx cap open android
npx cap open ios
```

- [ ] Build and submit to stores

### Option 3: Use Existing PWA

Your deployed app already works as a PWA:
- Users can "Add to Home Screen"
- Works offline
- Looks like native app
- No app store needed!

---

## 🐛 Deployment Troubleshooting

### Build Fails

**Problem**: Build command fails
**Solutions**:
- [ ] Check Node.js version (needs v18+)
- [ ] Delete `node_modules` and reinstall
- [ ] Check for TypeScript errors
- [ ] Review build logs for specific errors

### Database Connection Error

**Problem**: Can't connect to database
**Solutions**:
- [ ] Verify database is running
- [ ] Check connection string/credentials
- [ ] Verify firewall allows connection
- [ ] Check database host/port
- [ ] For Render: Use Internal Database URL

### CORS Errors

**Problem**: API calls blocked by CORS
**Solutions**:
- [ ] Update `FRONTEND_URL` in backend environment
- [ ] Verify CORS settings in `server/index.js`
- [ ] Clear browser cache
- [ ] Check backend logs

### 502 Bad Gateway

**Problem**: Nginx shows 502 error
**Solutions**:
- [ ] Check if backend is running: `pm2 status`
- [ ] Check backend logs: `pm2 logs`
- [ ] Verify port 5000 is correct
- [ ] Restart services: `pm2 restart all && systemctl restart nginx`

### Environment Variables Not Loading

**Problem**: App uses wrong config
**Solutions**:
- [ ] Verify `.env` file exists
- [ ] Check variable names match exactly
- [ ] Restart services after changing variables
- [ ] For Render/Railway: Check dashboard variables

### PWA Not Installing

**Problem**: "Add to Home Screen" not showing
**Solutions**:
- [ ] Must use HTTPS (except localhost)
- [ ] Check manifest.json is accessible
- [ ] Verify service worker registered
- [ ] iOS: Must use Safari
- [ ] Android: Must use Chrome

---

## 📊 Monitoring & Maintenance

### Regular Tasks:

**Weekly:**
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Review failed orders
- [ ] Check email delivery

**Monthly:**
- [ ] Update dependencies: `npm update`
- [ ] Review database size
- [ ] Check SSL certificate expiry
- [ ] Backup database
- [ ] Review user feedback

**As Needed:**
- [ ] Deploy bug fixes
- [ ] Add new features
- [ ] Scale resources if slow
- [ ] Optimize database queries

### Useful Commands:

**Check backend logs:**
```bash
# Render/Railway: Use dashboard
# VPS with PM2:
pm2 logs wholesale-backend
```

**Restart backend:**
```bash
# Render/Railway: Click "Manual Deploy"
# VPS:
pm2 restart wholesale-backend
```

**Database backup:**
```bash
# VPS:
pg_dump -U wholesale_user wholesale_app > backup.sql
```

**Restore database:**
```bash
# VPS:
psql -U wholesale_user wholesale_app < backup.sql
```

---

## 🎯 Quick Deploy Checklist (Copy This for Later)

When you're ready to deploy, copy and paste this checklist:

```
## Pre-Deploy
- [ ] Test locally
- [ ] Enable login
- [ ] Change JWT secret
- [ ] Add real products
- [ ] Push to GitHub

## Deploy (Choose Platform)
- [ ] Create database
- [ ] Deploy backend
- [ ] Add environment variables
- [ ] Seed database
- [ ] Deploy frontend
- [ ] Update CORS

## Test Production
- [ ] Browse products
- [ ] Add to cart
- [ ] Submit order
- [ ] Admin login
- [ ] Manage products
- [ ] Update order status

## Secure
- [ ] HTTPS enabled
- [ ] Strong passwords
- [ ] Firewall configured
- [ ] Backups scheduled

## Mobile
- [ ] Test on iPhone
- [ ] Test on Android
- [ ] Add to home screen
- [ ] Test offline mode
```

---

## 🆘 Need Help?

1. **Check logs** - Most issues show in logs
2. **Review checklist** - Make sure you completed all steps
3. **Test locally first** - Verify works on localhost
4. **Read error messages** - They usually point to the issue
5. **Check documentation** - Platform-specific docs:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Railway Docs](https://docs.railway.app)

---

## 🎉 Congratulations!

Your Wholesale Order App is now live and accessible to users worldwide!

**Next Steps:**
- Share the URL with your users
- Add your custom domain
- Configure email notifications
- Monitor usage and optimize
- Collect feedback and iterate

**Your app is now:**
- ✅ Accessible 24/7
- ✅ Secured with HTTPS
- ✅ Backed by reliable database
- ✅ Installable on mobile devices
- ✅ Ready for real business use

---

**Made with ❤️ - Happy Deploying!**
