import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SearchProvider } from './context/SearchContext';
import { FilterProvider } from './context/FilterContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import VendorsPage from './pages/VendorsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminVendors from './pages/admin/AdminVendors';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBuyerOverview from './pages/admin/AdminBuyerOverview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <FilterProvider>
              <SidebarProvider>
                <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route
                path="vendors"
                element={
                  <ProtectedRoute requireAdmin>
                    <VendorsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/orders"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/products"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/vendors"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminVendors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/buyer-overview"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminBuyerOverview />
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
              </SidebarProvider>
            </FilterProvider>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
