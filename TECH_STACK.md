# Tech Stack Documentation

## Overview
Cureate Connect is a full-stack Progressive Web Application (PWA) built with modern JavaScript technologies, designed to connect institutional buyers with local vendors while tracking diversity and economic impact metrics.

---

## Architecture

### Application Type
**MERN-like Stack** (Modified - PostgreSQL instead of MongoDB)
- **Frontend**: React SPA (Single Page Application)
- **Backend**: RESTful API (Node.js + Express)
- **Database**: Relational Database (PostgreSQL)
- **Deployment**: Client-Server Architecture

---

## Frontend Stack

### Core Framework
**React 18.2.0**
- **Purpose**: UI component library for building interactive user interfaces
- **Why**: Virtual DOM for performance, component reusability, large ecosystem
- **Use Cases**: All UI components, state management, routing

### Build Tool
**Vite 5.0.8**
- **Purpose**: Next-generation frontend build tool
- **Why**: Lightning-fast HMR (Hot Module Replacement), optimized production builds
- **Features**: ES modules, fast dev server, optimized bundling
- **Use Cases**: Development server, production bundling, asset optimization

### Routing
**React Router DOM 6.21.0**
- **Purpose**: Client-side routing for single-page applications
- **Why**: Declarative routing, nested routes, navigation management
- **Use Cases**: Page navigation, protected routes, dynamic routing

### Styling Framework
**TailwindCSS 3.4.0**
- **Purpose**: Utility-first CSS framework
- **Why**: Rapid UI development, consistent design system, small bundle size
- **Features**: Custom brand colors, responsive design, accessibility utilities
- **Supporting Tools**:
  - **PostCSS 8.4.32**: CSS transformations and autoprefixing
  - **Autoprefixer 10.4.16**: Automatic vendor prefixes for browser compatibility

### HTTP Client
**Axios 1.6.2**
- **Purpose**: Promise-based HTTP client
- **Why**: Interceptors for auth tokens, request/response transformation, error handling
- **Use Cases**: API calls to backend, authentication headers, error handling

### PDF Generation
**jsPDF 2.5.1 + jsPDF-AutoTable 3.8.2**
- **Purpose**: Client-side PDF generation
- **Why**: Generate receipts and reports without server load
- **Use Cases**: Order receipts, vendor reports, export functionality

### Data Processing
**PapaParse 5.5.3**
- **Purpose**: CSV parsing and generation
- **Why**: Fast, reliable CSV parsing in the browser
- **Use Cases**: CSV import/export, data processing

**XLSX 0.18.5**
- **Purpose**: Excel file parsing and generation
- **Why**: Export data to Excel format for business users
- **Use Cases**: Order exports, vendor data exports, reporting

### Progressive Web App (PWA)
**Vite PWA Plugin 0.17.4**
- **Purpose**: PWA capabilities for web app
- **Why**: Offline support, installable app, improved performance
- **Features**:
  - Service worker generation
  - Offline caching strategies
  - App manifest generation
  - Install prompts
- **Use Cases**: Mobile app installation, offline browsing, faster load times

### TypeScript Support
**@types/react 18.2.43 & @types/react-dom 18.2.17**
- **Purpose**: TypeScript type definitions
- **Why**: Better IDE support, type checking during development
- **Use Cases**: Development-time type safety, autocomplete

---

## Backend Stack

### Runtime Environment
**Node.js (v18+)**
- **Purpose**: JavaScript runtime for server-side code
- **Why**: JavaScript everywhere, async I/O, large package ecosystem
- **Use Cases**: API server, background processing, file handling

### Web Framework
**Express 4.18.2**
- **Purpose**: Minimal web application framework
- **Why**: Simple routing, middleware support, widely adopted
- **Use Cases**: REST API endpoints, middleware chain, request handling

### Database
**PostgreSQL 14+**
- **Purpose**: Relational database management system
- **Why**: ACID compliance, complex queries, data integrity, scalability
- **Features**:
  - Relational data modeling
  - Foreign key constraints
  - Advanced querying
  - JSON support
- **Use Cases**: Users, products, orders, vendors, transactions

**pg (node-postgres) 8.11.3**
- **Purpose**: PostgreSQL client for Node.js
- **Why**: Official PostgreSQL driver, connection pooling
- **Use Cases**: Database queries, connection management, transactions

### Security & Authentication

**bcrypt 5.1.1**
- **Purpose**: Password hashing library
- **Why**: Industry-standard password security, salt generation
- **Use Cases**: User password hashing, password verification

**jsonwebtoken (JWT) 9.0.2**
- **Purpose**: JSON Web Token implementation
- **Why**: Stateless authentication, secure token-based auth
- **Use Cases**: User authentication, session management, API authorization

### Cross-Origin Resource Sharing
**CORS 2.8.5**
- **Purpose**: Enable cross-origin requests
- **Why**: Allow frontend (different port) to communicate with backend
- **Use Cases**: API access from frontend, security configuration

### Environment Configuration
**dotenv 16.3.1**
- **Purpose**: Load environment variables from .env file
- **Why**: Separate configuration from code, security best practices
- **Use Cases**: Database credentials, JWT secrets, email configuration

### Email Service
**Nodemailer 6.9.7**
- **Purpose**: Email sending library
- **Why**: Multiple transport options, templating support
- **Use Cases**: Order confirmations, status updates, notifications

### File Upload
**Multer 1.4.5-lts.1**
- **Purpose**: Multipart/form-data handling
- **Why**: File upload handling, disk storage management
- **Use Cases**: Product images, vendor logos, document uploads

---

## Development Tools

### Hot Reload
**Nodemon 3.0.2**
- **Purpose**: Auto-restart server on file changes
- **Why**: Faster development workflow
- **Use Cases**: Backend development, automatic server restarts

### Process Management
**Concurrently 8.2.2**
- **Purpose**: Run multiple npm scripts simultaneously
- **Why**: Start frontend and backend with single command
- **Use Cases**: Development mode (`npm run dev`)

---

## Database Schema

### Core Tables
1. **users**
   - Admin and buyer authentication
   - Role-based access control
   - Password hashing with bcrypt

2. **products**
   - Product catalog
   - Vendor information
   - Pricing and inventory

3. **vendors**
   - Vendor profiles
   - Diversity indicators (women-owned, BIPOC-owned)
   - Contact information
   - Logo/image storage

4. **orders**
   - Order management
   - Batch number system
   - Status tracking
   - Timestamps

5. **order_items**
   - Order line items
   - Product quantities
   - Pricing snapshots

---

## API Architecture

### RESTful Endpoints

**Authentication Routes** (`/api/auth`)
- POST `/register` - User registration
- POST `/login` - User authentication
- GET `/me` - Get current user

**Product Routes** (`/api/products`)
- GET `/` - List all products
- GET `/:id` - Get product details
- POST `/` - Create product (admin)
- PUT `/:id` - Update product (admin)
- DELETE `/:id` - Delete product (admin)

**Order Routes** (`/api/orders`)
- GET `/` - List orders
- GET `/:id` - Get order details
- POST `/` - Create order
- PUT `/:id/status` - Update order status (admin)

**Vendor Routes** (`/api/vendors`)
- GET `/` - List vendors
- GET `/:id` - Get vendor details
- POST `/` - Create vendor (admin)
- PUT `/:id` - Update vendor (admin)

---

## State Management

### React Context API
**AuthContext**
- User authentication state
- Login/logout functionality
- Protected route handling

**CartContext**
- Shopping cart state
- Add/remove items
- Cart persistence (localStorage)
- Order submission

---

## Security Features

### Backend Security
- Password hashing (bcrypt)
- JWT token authentication
- Protected API routes with middleware
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection

### Frontend Security
- XSS prevention (React escaping)
- Secure token storage
- HTTPS enforcement (production)
- Input validation
- Role-based UI rendering

---

## Performance Optimizations

### Frontend
- Code splitting (React Router)
- Lazy loading components
- Image optimization
- Service worker caching (PWA)
- Vite's optimized builds
- Minification and compression

### Backend
- PostgreSQL connection pooling
- Efficient database queries
- Indexed database columns
- Response compression
- Static asset serving

---

## Accessibility Features

### WCAG Compliance
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- High contrast colors
- Large touch targets (44px+)
- Minimum 16px font size
- Screen reader support

---

## Brand Customization

### Design System
**Colors**
- Primary Dark: #035257
- Primary Main: #377b82
- Background: #f7f5ef (Cream)

**Typography**
- Base font: 16px minimum
- Large headings for readability
- Senior-friendly sizing

**Components**
- Consistent button styles
- Form validation feedback
- Loading states
- Error handling

---

## Deployment Stack

### Recommended Platforms

**Render**
- Web service for backend
- Static site for frontend
- PostgreSQL add-on
- Environment variable management

**Railway**
- Full-stack deployment
- PostgreSQL plugin
- GitHub integration
- Automatic deployments

**Custom Enterprise**
- Docker containerization
- Kubernetes orchestration
- Cloud providers (AWS, Azure, GCP)
- CDN integration

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install
cd client && npm install

# Setup database
psql -U postgres -c "CREATE DATABASE cureate_connect"

# Seed data
npm run seed

# Run development servers
npm run dev  # Runs both frontend and backend
```

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start production server
npm start
```

---

## Testing Strategy

### Manual Testing
- User flow testing
- Cross-browser testing
- Mobile device testing
- PWA installation testing

### Future Testing Tools (Recommended)
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **Supertest**: API testing

---

## Monitoring & Analytics (Future)

### Recommended Tools
- **Sentry**: Error tracking
- **Google Analytics**: User analytics
- **LogRocket**: Session replay
- **New Relic**: Performance monitoring

---

## License
MIT License - Open source and customizable for institutional procurement needs

---

## Related Documentation
- [README.md](README.md) - Project overview and quick start
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [FEATURES.md](FEATURES.md) - Feature documentation
