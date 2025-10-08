# Setup Guide - Wholesale Order App

## Prerequisites

Before starting, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** (optional) - [Download here](https://git-scm.com/)

## Step-by-Step Setup

### 1. Install Node.js Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd client
npm install
cd ..
```

### 2. Setup PostgreSQL Database

#### Windows:
1. Open pgAdmin or psql command line
2. Create a new database called `wholesale_app`:
   ```sql
   CREATE DATABASE wholesale_app;
   ```

#### Mac/Linux:
```bash
psql -U postgres
CREATE DATABASE wholesale_app;
\q
```

### 3. Configure Environment Variables

The `.env` file has been created with default settings. **Update the following if needed:**

- `DB_PASSWORD`: Your PostgreSQL password (default: `postgres`)
- `DB_USER`: Your PostgreSQL username (default: `postgres`)
- `JWT_SECRET`: Change this to a random string in production

**Optional Email Configuration:**
If you want to enable email notifications, update these fields:
- `EMAIL_HOST`: Your SMTP server (e.g., smtp.gmail.com)
- `EMAIL_USER`: Your email address
- `EMAIL_PASSWORD`: Your email app password

**Login Toggle:**
- `ENABLE_LOGIN=false`: Login is disabled for easy testing
- `ENABLE_LOGIN=true`: Enable authentication (users must sign up/login)

### 4. Initialize Database & Seed Data

Run the database seeding script to create tables and add sample data:

```bash
npm run seed
```

This will:
- Create all necessary database tables (users, products, orders)
- Create an admin user: `admin@wholesalehub.com` / `admin123`
- Add 10 sample wholesale products

### 5. Start the Application

Start both the backend server and frontend development server:

```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:5173

Open your browser and go to **http://localhost:5173**

## Default Login Credentials

### Admin User:
- Email: `admin@wholesalehub.com`
- Password: `admin123`

### Testing Without Login:
If `ENABLE_LOGIN=false` in `.env`, you can access the app directly without signing up.

To enable login, change `.env`:
```
ENABLE_LOGIN=true
```

## Using the App

### As a User (Buyer):
1. Browse products on the Products page
2. Use filters to find specific products
3. Add items to your cart
4. Submit orders (they get a batch number)
5. View your order history with status updates

### As an Admin:
1. Login with admin credentials
2. Click "Admin" in the navigation
3. View dashboard with order statistics
4. Manage Orders: Update status, add notes
5. Manage Products: Add, edit, or delete products

## PWA (Progressive Web App) Features

### Install on Mobile:

#### iOS (iPhone/iPad):
1. Open http://localhost:5173 in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

#### Android:
1. Open http://localhost:5173 in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home screen"
4. Tap "Add"

The app will work offline and look like a native mobile app!

## Deployment (Production)

### Option 1: Deploy to Render (Recommended)

**Backend:**
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables from `.env`
8. Create a PostgreSQL database on Render
9. Deploy!

**Frontend:**
1. Build the frontend: `cd client && npm run build`
2. Deploy the `client/dist` folder to:
   - Vercel
   - Netlify
   - Render (Static Site)

### Option 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy!

## Troubleshooting

### Database Connection Error:
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database `wholesale_app` exists

### Port Already in Use:
- Change `PORT=5000` in `.env` to another port (e.g., `PORT=5001`)

### Email Not Sending:
- Email configuration is optional
- Leave EMAIL fields empty to skip email notifications
- For Gmail, use an "App Password" instead of your regular password

### Frontend Not Loading:
- Make sure you ran `npm install` in both root and `client` directories
- Check that backend is running on port 5000

## Creating PWA Icons

For a production app, create custom icons:

1. Create a square logo (1024x1024px)
2. Use a tool like [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Generate PWA icons (192x192 and 512x512)
4. Place them in `client/public/`
5. Update `client/public/manifest.webmanifest`

## Next Steps

- Customize the branding (logo, colors in `tailwind.config.js`)
- Add more products via Admin panel
- Configure email notifications
- Deploy to production
- Test on actual mobile devices

## Need Help?

Check the README.md for more information or refer to the code comments.

Enjoy your Wholesale Order App! 🎉
