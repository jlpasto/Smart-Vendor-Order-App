# 🔧 Troubleshooting Guide

Common issues and solutions for the Wholesale Order App.

---

## Installation Issues

### ❌ `npm install` fails

**Symptoms:**
- Error messages during `npm install`
- Missing dependencies

**Solutions:**
1. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node.js version:
   ```bash
   node -v  # Should be v18 or higher
   ```

3. Clear npm cache:
   ```bash
   npm cache clean --force
   npm install
   ```

---

## Database Issues

### ❌ "Database connection error"

**Symptoms:**
- Can't connect to PostgreSQL
- Error: "password authentication failed"

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Windows: Check Services
   # Mac: brew services list
   # Linux: sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l | grep wholesale_app
   ```

3. **Check `.env` credentials:**
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_actual_password
   DB_NAME=wholesale_app
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. **Create database if missing:**
   ```bash
   psql -U postgres -c "CREATE DATABASE wholesale_app"
   ```

### ❌ "relation does not exist" errors

**Symptoms:**
- Tables not found
- Can't query products/orders

**Solution:**
Run the seed script to create tables:
```bash
npm run seed
```

---

## Server Issues

### ❌ "Port 5000 already in use"

**Symptoms:**
- Error: EADDRINUSE :::5000
- Can't start server

**Solutions:**

1. **Change port in `.env`:**
   ```env
   PORT=5001
   ```

2. **Find and kill process on port 5000:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

### ❌ Backend starts but frontend can't connect

**Symptoms:**
- Backend runs on port 5000
- Frontend shows API errors

**Solutions:**

1. **Check CORS settings** in `server/index.js`:
   ```javascript
   cors({
     origin: 'http://localhost:5173',
     credentials: true
   })
   ```

2. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Check frontend proxy** in `client/vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:5000'
     }
   }
   ```

---

## Frontend Issues

### ❌ "Module not found" errors

**Symptoms:**
- Import errors in React
- Can't find components/pages

**Solutions:**

1. **Install frontend dependencies:**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ```

2. **Check file paths** - all imports should be relative:
   ```javascript
   import { useAuth } from '../context/AuthContext'
   ```

### ❌ White screen / blank page

**Symptoms:**
- App loads but shows nothing
- No errors in console

**Solutions:**

1. **Check console for errors:**
   - Open browser DevTools (F12)
   - Look for red errors in Console tab

2. **Verify API is running:**
   - Backend should be on http://localhost:5000
   - Check Network tab for failed requests

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### ❌ Cart not persisting

**Symptoms:**
- Cart empties on refresh
- Items disappear

**Solutions:**

1. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Look for cart data

2. **Disable incognito/private mode** - localStorage doesn't persist

3. **Clear localStorage and try again:**
   ```javascript
   localStorage.clear()
   ```

---

## Authentication Issues

### ❌ Can't login / "Invalid credentials"

**Symptoms:**
- Login fails with correct password
- No users found

**Solutions:**

1. **Check if admin user exists:**
   ```bash
   psql -U postgres -d wholesale_app -c "SELECT email FROM users"
   ```

2. **Re-run seed script:**
   ```bash
   npm run seed
   ```

3. **Verify ENABLE_LOGIN setting:**
   ```env
   ENABLE_LOGIN=false  # No login required (testing)
   ENABLE_LOGIN=true   # Login required
   ```

### ❌ "Token expired" errors

**Symptoms:**
- Logged out unexpectedly
- Need to login again

**Solution:**
Tokens expire after 7 days. This is normal - just login again.

To extend token lifetime, edit `server/routes/auth.js`:
```javascript
{ expiresIn: '30d' }  // 30 days instead of 7
```

---

## Email Issues

### ❌ Emails not sending

**Symptoms:**
- No order confirmation emails
- No status update emails

**Solutions:**

1. **Email is optional** - app works without it
   Leave EMAIL settings empty in `.env` to skip emails

2. **For Gmail, use App Password:**
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
   - Use that in `.env`:
     ```env
     EMAIL_USER=your@gmail.com
     EMAIL_PASSWORD=your_app_password
     ```

3. **Check email config:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@email.com
   EMAIL_PASSWORD=your_password
   ```

4. **Test SMTP connection:**
   - Check spam/junk folder
   - Verify email credentials

---

## PWA Issues

### ❌ "Add to Home Screen" not showing

**Symptoms:**
- Can't install as app
- No install prompt

**Solutions:**

1. **iOS Requirements:**
   - Must use Safari browser
   - Look for Share button → Add to Home Screen

2. **Android Requirements:**
   - Must use Chrome browser
   - HTTPS required in production (localhost is OK)

3. **Check manifest.json:**
   ```bash
   http://localhost:5173/manifest.webmanifest
   ```

4. **Service worker registration:**
   - Open DevTools → Application → Service Workers
   - Should show "activated and running"

### ❌ App not working offline

**Symptoms:**
- No offline functionality
- Errors when disconnected

**Solutions:**

1. **PWA needs to be installed first**
   - Add to home screen
   - Open from home screen icon

2. **Clear service worker and re-register:**
   - DevTools → Application → Service Workers
   - Click "Unregister"
   - Reload page

3. **Check cache:**
   - DevTools → Application → Cache Storage
   - Should see cached resources

---

## Product/Order Issues

### ❌ Products not loading

**Symptoms:**
- Empty product page
- No items in grid

**Solutions:**

1. **Run seed script:**
   ```bash
   npm run seed
   ```

2. **Check database:**
   ```bash
   psql -U postgres -d wholesale_app -c "SELECT COUNT(*) FROM products"
   ```

3. **Verify API endpoint:**
   ```bash
   curl http://localhost:5000/api/products
   ```

### ❌ Orders not submitting

**Symptoms:**
- "Submit Order" fails
- No batch number generated

**Solutions:**

1. **Check user authentication:**
   - Make sure you're logged in (if ENABLE_LOGIN=true)
   - Check token in localStorage

2. **Verify cart has items:**
   - Add products to cart first
   - Check cart count in navbar

3. **Check browser console** for API errors

### ❌ PDF download not working

**Symptoms:**
- "Download PDF" button does nothing
- No PDF generated

**Solutions:**

1. **Check jsPDF is installed:**
   ```bash
   cd client
   npm list jspdf
   ```

2. **Reinstall dependencies:**
   ```bash
   cd client
   npm install jspdf jspdf-autotable
   ```

3. **Check browser console** for errors

---

## Performance Issues

### ❌ Slow loading / laggy UI

**Solutions:**

1. **Check database indexes:**
   - Run seed script (creates indexes)
   - `npm run seed`

2. **Clear browser cache:**
   - Hard refresh page
   - Clear site data in DevTools

3. **Reduce image sizes:**
   - Use smaller product images
   - Compress images before upload

4. **Check database connection pool:**
   - Default max 20 connections
   - Adjust in `server/config/database.js`

---

## Development Issues

### ❌ Hot reload not working

**Symptoms:**
- Changes don't appear
- Need to restart server

**Solutions:**

1. **For backend (nodemon):**
   ```bash
   # Kill and restart
   npm run server
   ```

2. **For frontend (Vite):**
   ```bash
   cd client
   npm run dev
   ```

3. **Check file watchers:**
   - Some systems have file watcher limits
   - Increase limit on Linux:
     ```bash
     echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
     sudo sysctl -p
     ```

---

## Build/Production Issues

### ❌ Production build fails

**Symptoms:**
- `npm run build` errors
- Build process stops

**Solutions:**

1. **Check for TypeScript errors** (if any):
   ```bash
   cd client
   npm run build -- --mode development
   ```

2. **Clear build cache:**
   ```bash
   cd client
   rm -rf dist node_modules/.vite
   npm run build
   ```

3. **Fix import errors:**
   - Check all file paths
   - Ensure all dependencies are installed

---

## Still Having Issues?

1. **Check the error message carefully**
   - Read the full error in console/terminal
   - Google the specific error

2. **Review documentation:**
   - [SETUP.md](SETUP.md) - Full setup guide
   - [QUICK_START.md](QUICK_START.md) - Quick setup
   - [FEATURES.md](FEATURES.md) - Feature documentation

3. **Verify environment:**
   ```bash
   node -v        # v18+
   npm -v         # v9+
   psql --version # v14+
   ```

4. **Start fresh:**
   ```bash
   # Delete everything and reinstall
   rm -rf node_modules client/node_modules
   npm install
   cd client && npm install && cd ..
   npm run seed
   npm run dev
   ```

---

## Quick Diagnostic Checklist

- [ ] PostgreSQL is running
- [ ] Database `wholesale_app` exists
- [ ] `.env` file exists with correct values
- [ ] Node modules installed (`npm install` in root and `client/`)
- [ ] Seed script ran successfully (`npm run seed`)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] No errors in browser console
- [ ] No errors in terminal

If all above are checked, the app should work! 🎉
