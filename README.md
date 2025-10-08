# 🛒 Wholesale Order App - Progressive Web App

> A simple and intuitive wholesale ordering Progressive Web App with PostgreSQL backend, designed for easy mobile deployment and senior-friendly UI.

![Status](https://img.shields.io/badge/status-ready-green)
![Node](https://img.shields.io/badge/node-v18+-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-v14+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes! ⚡
- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[FEATURES.md](FEATURES.md)** - Full feature documentation
- **[.env.example](.env.example)** - Environment variables reference

---

## ✨ Key Features

### For Users (Buyers)
- 🛍️ **Product Browsing** - Search and filter by vendor, state, category, popular, and new items
- ⭐ **Favorites** - Star products for easy reordering
- 🛒 **Smart Cart** - Persistent cart with quantity controls
- 📦 **Batch Orders** - Auto-generated batch numbers (BATCH-2025-XXXXXX)
- 📧 **Email Updates** - Order confirmations and status notifications
- 📄 **PDF Receipts** - Download and print order details
- 📱 **Mobile PWA** - Install as app on iOS/Android

### For Admins
- 📊 **Dashboard** - Real-time stats and metrics
- 📝 **Order Management** - Update status, add notes, filter by date/vendor
- ➕ **Product Management** - Full CRUD operations
- 📧 **Auto Notifications** - Email customers on status changes
- 👥 **User Overview** - View all orders across customers

### Senior-Friendly Design
- 📏 **Large Text** - Minimum 16px base font size
- 👆 **Big Buttons** - 44px+ touch targets
- 🎨 **High Contrast** - Easy-to-read color scheme
- 📱 **Mobile-First** - Optimized for small screens
- ✅ **Clear Actions** - Confirmation dialogs for important steps

---

## 🚀 Quick Start

### 1️⃣ Install Dependencies (2 minutes)
```bash
npm install
cd client && npm install
cd ..
```

### 2️⃣ Create Database (1 minute)
```bash
psql -U postgres -c "CREATE DATABASE wholesale_app"
```

### 3️⃣ Seed Data (1 minute)
```bash
npm run seed
```
This creates:
- ✅ Admin user: `admin@wholesalehub.com` / `admin123`
- ✅ 10 sample wholesale products

### 4️⃣ Start App (30 seconds)
```bash
npm run dev
```

### 5️⃣ Open Browser
Go to **http://localhost:5173** 🎉

> **Note:** Login is disabled by default for easy testing. Set `ENABLE_LOGIN=true` in `.env` to enable authentication.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL 14+ |
| **Auth** | JWT + bcrypt |
| **Email** | Nodemailer |
| **PDF** | jsPDF + autotable |
| **PWA** | Vite PWA Plugin + Service Workers |

---

## 📱 Progressive Web App

### Install on Mobile

**iOS (Safari):**
1. Open app in Safari
2. Tap Share → Add to Home Screen
3. Enjoy offline-capable app!

**Android (Chrome):**
1. Open app in Chrome
2. Tap Menu → Add to Home screen
3. Install and launch!

**Features:**
- ✅ Offline support
- ✅ App-like experience
- ✅ Home screen icon
- ✅ Fast loading with caching

---

## 🗂️ Sample Data

The seed script includes:

### Admin User
- Email: `admin@wholesalehub.com`
- Password: `admin123`

### 10 Sample Products
- Organic Potato Chips - $36.00/case
- Sparkling Water - $24.00/case
- Quinoa & Ancient Grains - $54.00/case
- Artisan Dark Chocolate - $60.00/case
- Mixed Nuts - $72.00/case
- Organic Pasta - $30.00/case
- Tortilla Chips - $42.00/case
- Cold Brew Coffee - $48.00/case
- Gourmet Cookies - $56.00/case
- Steel Cut Oats - $36.00/case

---

## 🎯 Use Cases

Perfect for:
- Wholesale distributors
- Food & beverage suppliers
- B2B ordering systems
- Vendor management platforms
- Small to medium wholesale businesses

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Protected API routes
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Environment variable security

---

## 📋 Environment Variables

Key settings in `.env`:

```bash
# Database
DB_NAME=wholesale_app
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication (disable for testing)
ENABLE_LOGIN=false

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@email.com
```

---

## 🧪 Testing

### Test User Flow
1. Browse Products
2. Add 3-4 items to cart
3. Submit order
4. View order history
5. Download PDF receipt

### Test Admin Flow
1. Enable login: `ENABLE_LOGIN=true`
2. Login as admin
3. Go to Admin Dashboard
4. Update order status
5. Add admin note
6. Check email notification

---

## 🌐 Default Users

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@wholesalehub.com | admin123 | Full access |
| **User** | Sign up yourself | - | Buyer access |

## 📁 Project Structure

```
wholesale-order-app/
├── server/                 # Backend API (Node.js + Express)
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth & validation middleware
│   ├── routes/            # API endpoints (auth, products, orders)
│   ├── utils/             # Email notifications
│   ├── index.js           # Server entry point
│   └── seed.js            # Database seeding script
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable components (Layout, etc.)
│   │   ├── pages/         # All pages (Products, Cart, Orders, Admin)
│   │   ├── context/       # State management (Auth, Cart)
│   │   ├── App.jsx        # Main app with routing
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets (PWA icons, manifest)
│   └── vite.config.js     # Vite + PWA configuration
├── .env                   # Environment variables (created from .env.example)
├── package.json           # Backend dependencies & scripts
└── README.md              # This file
```

---

## 🚢 Deployment

### Option 1: Render (Recommended)

**Backend:**
1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect GitHub repo
4. Add PostgreSQL database
5. Set environment variables from `.env`
6. Deploy!

**Frontend:**
1. Build: `cd client && npm run build`
2. Deploy `client/dist` to Render Static Site

### Option 2: Railway

1. Visit [Railway.app](https://railway.app)
2. Create project from GitHub
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy!

### Option 3: Vercel + Render

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- Update CORS and API URLs

> See [SETUP.md](SETUP.md) for detailed deployment instructions

---

## 📊 Database Schema

### Products Table (20 fields)
- Product details, pricing, inventory
- Auto-calculated GM% (Gross Margin)
- Popular/New badges
- Vendor and category info

### Orders Table (10+ fields)
- Batch order system
- Status tracking
- User association
- Admin notes

### Users Table
- Email/password authentication
- Role-based access (user/admin)

---

## 🤝 Contributing

This is a standalone project template. Feel free to:
- Fork and customize for your business
- Add new features
- Improve the UI/UX
- Submit issues for bugs

---

## 📞 Support

- 📖 Check [SETUP.md](SETUP.md) for setup issues
- 📝 Review [FEATURES.md](FEATURES.md) for feature details
- ⚡ See [QUICK_START.md](QUICK_START.md) for quick setup

---

## 🎉 What's Included

✅ Complete user authentication system
✅ Product catalog with search & filters
✅ Shopping cart with persistence
✅ Batch order system
✅ Admin dashboard with analytics
✅ Email notifications
✅ PDF receipt generation
✅ PWA with offline support
✅ Mobile-responsive design
✅ Senior-friendly UI
✅ Sample data for testing
✅ Production-ready code

---

## 🔮 Future Enhancements

- [ ] Image upload to cloud storage
- [ ] Bulk CSV import/export
- [ ] Advanced analytics dashboard
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Shipping tracking
- [ ] Inventory management

---

## 📄 License

MIT License - feel free to use this project for commercial or personal purposes.

---

## 🙏 Acknowledgments

Built with modern web technologies:
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [PostgreSQL](https://www.postgresql.org)
- [Express](https://expressjs.com)

---

**Made with ❤️ for wholesale businesses**

*Ready to deploy • Easy to customize • Senior-friendly*
