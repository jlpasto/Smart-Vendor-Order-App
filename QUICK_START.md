# 🚀 Quick Start Guide

## Get Up and Running in 5 Minutes!

### Step 1: Install Dependencies (2 min)

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Setup Database (1 min)

Make sure PostgreSQL is running, then:

```bash
# Open psql or pgAdmin and create database
CREATE DATABASE wholesale_app;
```

Or via command line:
```bash
psql -U postgres -c "CREATE DATABASE wholesale_app"
```

### Step 3: Initialize Database (1 min)

```bash
# This creates tables and adds sample data
npm run seed
```

You should see:
- ✅ Admin user created: admin@wholesalehub.com / admin123
- ✅ 10 sample products inserted

### Step 4: Start the App (30 sec)

```bash
npm run dev
```

This starts both servers:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Step 5: Open in Browser (30 sec)

Go to: **http://localhost:5173**

🎉 **Done!** The app is running!

---

## First Login

Since `ENABLE_LOGIN=false` by default, you can browse immediately without signing up.

To test admin features:
1. Change `.env`: `ENABLE_LOGIN=true`
2. Restart server: `npm run dev`
3. Login as admin:
   - Email: `admin@wholesalehub.com`
   - Password: `admin123`

---

## What Can You Do Now?

### As a User (Buyer):
1. 🛍️ **Browse Products** - Click "Products"
2. 🔍 **Search & Filter** - Try searching or filtering by vendor/category
3. 🛒 **Add to Cart** - Click "Add to Cart" on any product
4. ✅ **Submit Order** - Go to Cart and click "Submit Order"
5. 📦 **View Orders** - Check "My Orders" to see your batch orders

### As an Admin:
1. 🔐 **Enable Login** (change `.env` to `ENABLE_LOGIN=true`)
2. 🔑 **Login** as admin@wholesalehub.com / admin123
3. 📊 **View Dashboard** - Click "Admin" in navigation
4. 📝 **Manage Orders** - Update status, add notes
5. ➕ **Manage Products** - Add, edit, or delete products

---

## Testing the App

### Test User Flow:
```
Browse Products → Add 3-4 items to cart → Submit Order → View in "My Orders"
```

### Test Admin Flow:
```
Login as Admin → Go to Admin → Manage Orders → Update status to "Completed" → Add note
```

### Test PWA (Mobile):
1. Open http://localhost:5173 on your phone (same WiFi network)
2. Use your computer's local IP: http://192.168.x.x:5173
3. Add to home screen
4. Test offline mode

---

## Common Issues & Fixes

### ❌ Database connection error
**Fix:** Make sure PostgreSQL is running and check `.env` for correct password

### ❌ Port 5000 already in use
**Fix:** Change `PORT=5001` in `.env`

### ❌ Frontend won't load
**Fix:** Make sure you ran `npm install` in BOTH root and `client` folders

### ❌ "Module not found" errors
**Fix:** Delete `node_modules` and run `npm install` again

---

## File Structure

```
wholesale-order-app/
├── server/              # Backend API
│   ├── config/         # Database setup
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth middleware
│   └── utils/          # Email helpers
├── client/             # Frontend React app
│   ├── src/
│   │   ├── pages/      # All pages
│   │   ├── components/ # Reusable components
│   │   └── context/    # State management
│   └── public/         # Static files
├── .env                # Environment config
└── package.json        # Dependencies
```

---

## Next Steps

### Customize Your App:
1. 📝 **Add Real Products** - Use Admin panel to add your products
2. 🎨 **Change Colors** - Edit `client/tailwind.config.js`
3. 🖼️ **Add Logo** - See `client/public/LOGO_INSTRUCTIONS.md`
4. 📧 **Enable Emails** - Add SMTP settings to `.env`

### Deploy to Production:
1. Read `SETUP.md` for deployment guide
2. Use Render, Railway, or Vercel
3. Set production environment variables
4. Change `ENABLE_LOGIN=true` for security

---

## Documentation

- **SETUP.md** - Full setup instructions
- **FEATURES.md** - Complete feature list
- **README.md** - Project overview
- **LOGO_INSTRUCTIONS.md** - How to add custom logos

---

## Sample Data Included

✅ **1 Admin User:**
- admin@wholesalehub.com / admin123

✅ **10 Sample Products:**
- Organic Potato Chips
- Sparkling Water
- Quinoa Mix
- Dark Chocolate Bars
- Mixed Nuts
- Organic Pasta
- Tortilla Chips
- Cold Brew Coffee
- Gourmet Cookies
- Steel Cut Oats

---

## Support

For issues or questions:
1. Check the documentation files
2. Review the code comments
3. Check console for error messages

---

**Enjoy your Wholesale Order App!** 🎉

Built with ❤️ using React, Node.js, and PostgreSQL
