# 🌱 Cureate Connect - Local Procurement Platform

> A modern Progressive Web App connecting institutional buyers with diverse local vendors, empowering small businesses through strategic procurement opportunities.

![Status](https://img.shields.io/badge/status-ready-green)
![Node](https://img.shields.io/badge/node-v18+-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-v14+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 About Cureate Connect

Cureate Connect serves as a bridge between institutional buyers and local food businesses, creating strategic procurement opportunities while supporting diverse vendors in your community.

### Our Mission
Empower local small businesses by:
- Creating procurement opportunities with anchor institutions
- Providing comprehensive business support
- Supporting diverse and women-owned businesses
- Tracking economic impact of local purchasing

### Our Impact
- **350+** Local businesses represented
- **35%** BIPOC-owned businesses
- **50%+** Women-owned businesses
- **100%** Commitment to local economic growth

---

## 📚 Documentation

### Start Here:
- **[DOCS_INDEX.md](DOCS_INDEX.md)** - 📖 **Complete documentation index** (find anything!)
- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes! ⚡
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - ⭐ **What to do next** (after setup)

### Reference Guides:
- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 🚀 **Deploy to production** (3 options)
- **[FEATURES.md](FEATURES.md)** - Full feature documentation
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & fixes
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project status & overview
- **[.env.example](.env.example)** - Environment variables reference

---

## ✨ Key Features

### For Buyers (Institutions)
- 🛍️ **Local Product Discovery** - Browse products from diverse local vendors
- 🏢 **Vendor Diversity** - Filter by BIPOC-owned, women-owned businesses
- 🛒 **Streamlined Ordering** - Simplified procurement from multiple vendors
- 📦 **Batch Orders** - Consolidated ordering with auto-generated batch numbers
- 📊 **Impact Tracking** - Monitor your contribution to local economy
- 📧 **Order Management** - Email confirmations and status updates
- 📄 **PDF Documentation** - Download receipts and reports
- 📱 **Mobile PWA** - Install as app on iOS/Android

### For Vendors
- 🌟 **Business Exposure** - Reach institutional buyers
- 📈 **Growth Opportunities** - Access larger sales channels
- 💼 **Business Support** - Strategic marketing and consulting
- 🤝 **Community Network** - Connect with other local businesses

### For Admins
- 📊 **Dashboard** - Real-time metrics and vendor analytics
- 📝 **Order Management** - Process orders, update status, add notes
- ➕ **Product Management** - Full CRUD operations
- 👥 **Vendor Management** - Track vendor performance and diversity metrics
- 📧 **Automated Communications** - Status updates to buyers and vendors

### Accessibility & Senior-Friendly Design
- 📏 **Large Text** - Minimum 16px base font size
- 👆 **Big Touch Targets** - 44px+ buttons for easy interaction
- 🎨 **High Contrast** - Brand colors optimized for readability
- 📱 **Mobile-First** - Responsive design for all devices
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
psql -U postgres -c "CREATE DATABASE cureate_connect"
```

### 3️⃣ Seed Data (1 minute)
```bash
npm run seed
```
This creates:
- ✅ Admin user: `admin@cureateconnect.com` / `admin123`
- ✅ 10 sample local products from diverse vendors

### 4️⃣ Start App (30 seconds)
```bash
npm run dev
```

To Test Locally:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client
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
| **Styling** | Custom Cureate Connect brand colors |

### Brand Colors
- **Primary Dark**: #035257
- **Primary Main**: #377b82
- **Background**: #f7f5ef (Cream)

---

## 📱 Progressive Web App

### Install on Mobile

**iOS (Safari):**
1. Open Cureate Connect in Safari
2. Tap Share → Add to Home Screen
3. Access offline-capable app!

**Android (Chrome):**
1. Open Cureate Connect in Chrome
2. Tap Menu → Add to Home screen
3. Install and launch!

**Features:**
- ✅ Offline support
- ✅ App-like experience
- ✅ Custom Cureate Connect icon
- ✅ Fast loading with intelligent caching

---

## 🗂️ Sample Data

The seed script includes diverse vendor examples:

### Admin User
- Email: `admin@cureateconnect.com`
- Password: `admin123`

### 10 Sample Local Products
- Organic Potato Chips (Local Farm Co-op) - $36.00/case
- Sparkling Water (Women-Owned Beverage Co.) - $24.00/case
- Quinoa & Ancient Grains (BIPOC-Owned Supplier) - $54.00/case
- Artisan Dark Chocolate (Family Business) - $60.00/case
- Mixed Nuts (Cooperative) - $72.00/case
- Organic Pasta (Local Mill) - $30.00/case
- Tortilla Chips (Women-Owned) - $42.00/case
- Cold Brew Coffee (Local Roaster) - $48.00/case
- Gourmet Cookies (BIPOC-Owned Bakery) - $56.00/case
- Steel Cut Oats (Regional Farm) - $36.00/case

---

## 🎯 Use Cases

Perfect for:
- **Anchor Institutions** - Hospitals, universities, corporate offices
- **Hospitality Venues** - Hotels, event spaces, conference centers
- **Government Agencies** - Supporting local procurement initiatives
- **Corporate Buyers** - Meeting diversity and sustainability goals
- **Food Service Providers** - Sourcing from local vendors

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
- ✅ Vendor verification system

---

## 📋 Environment Variables

Key settings in `.env`:

```bash
# Database
DB_NAME=cureate_connect
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication (disable for testing)
ENABLE_LOGIN=false

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=notifications@cureateconnect.com

# Branding
APP_NAME=Cureate Connect
COMPANY_URL=https://www.cureate.co/connect
```

---

## 🧪 Testing

### Test Buyer Flow
1. Browse local products
2. Filter by vendor type (women-owned, BIPOC-owned)
3. Add 3-4 items to cart
4. Submit order
5. View order history
6. Download PDF receipt

### Test Admin Flow
1. Enable login: `ENABLE_LOGIN=true`
2. Login as admin
3. Go to Admin Dashboard
4. View vendor diversity metrics
5. Update order status
6. Check automated notifications

---

## 🌐 Default Users

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@cureateconnect.com | admin123 | Full platform access |
| **Buyer** | Sign up as institution | - | Buyer access |

## 📁 Project Structure

```
cureate-connect/
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
├── .env                   # Environment variables
├── package.json           # Backend dependencies & scripts
└── README.md              # This file
```

---

## 🚢 Deployment

### Option 1: Render (Recommended for Institutions)

**Backend:**
1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect GitHub repo
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

**Frontend:**
1. Build: `cd client && npm run build`
2. Deploy `client/dist` to Render Static Site

### Option 2: Railway (Quick Setup)

1. Visit [Railway.app](https://railway.app)
2. Create project from GitHub
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy!

### Option 3: Enterprise Deployment

For enterprise deployments with custom domains and enhanced security, contact Cureate Connect support.

> See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions

---

## 📊 Platform Features

### Vendor Diversity Tracking
- Women-owned business indicators
- BIPOC-owned business indicators
- Local business certifications
- Impact reporting

### Economic Impact Metrics
- Local spend tracking
- Job creation estimates
- Community investment calculations
- Sustainability metrics

---

## 🤝 About Cureate

Cureate Connect is part of the Cureate ecosystem, dedicated to empowering local food businesses through strategic partnerships and technology.

**Learn More:** [https://www.cureate.co/connect](https://www.cureate.co/connect)

### Our Services
- **For Vendors**: Business exposure, growth opportunities, marketing support
- **For Buyers**: Simplified local sourcing, diversity tracking, impact reporting
- **For Communities**: Economic development, job creation, sustainable food systems

---

## 📞 Support

- 📖 Check [SETUP.md](SETUP.md) for setup issues
- 📝 Review [FEATURES.md](FEATURES.md) for feature details
- ⚡ See [QUICK_START.md](QUICK_START.md) for quick setup
- 🌐 Visit [cureate.co/connect](https://www.cureate.co/connect) for more information

---

## 🎉 What's Included

✅ Complete authentication system
✅ Local vendor catalog with diversity filters
✅ Shopping cart with vendor grouping
✅ Batch order system
✅ Admin dashboard with impact analytics
✅ Email notifications
✅ PDF receipt generation
✅ PWA with offline support
✅ Mobile-responsive design
✅ Senior-friendly UI
✅ Vendor diversity tracking
✅ Economic impact reporting
✅ Production-ready code

---

## 🔮 Future Enhancements

- [ ] Vendor onboarding portal
- [ ] Advanced diversity certifications
- [ ] Impact dashboard for buyers
- [ ] Vendor performance analytics
- [ ] Multi-location support
- [ ] Integration with accounting systems
- [ ] Automated vendor payments
- [ ] Sustainability scoring
- [ ] Community marketplace features

---

## 📄 License

MIT License - Cureate Connect encourages innovation in local procurement technology.

---

## 🙏 Acknowledgments

Built with modern web technologies and a commitment to supporting local businesses:
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [PostgreSQL](https://www.postgresql.org)
- [Express](https://expressjs.com)

---

**Empowering Local Businesses Through Strategic Procurement**

*A Cureate Connect Platform • Supporting Diversity • Building Community*