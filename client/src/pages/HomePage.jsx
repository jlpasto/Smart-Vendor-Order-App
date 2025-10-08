import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HomePage = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="page-title mb-4">
          Welcome to Wholesale Order Hub
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Your simple and intuitive platform for wholesale ordering. Browse products, add to cart, and place orders with ease.
        </p>
        <Link to="/products" className="btn-primary inline-block">
          Browse Products
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2">Easy Search</h3>
          <p className="text-gray-600 text-lg">
            Find products quickly with our powerful search and filter options
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2">Simple Cart</h3>
          <p className="text-gray-600 text-lg">
            Add items to your cart and review before placing your order
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2">Track Orders</h3>
          <p className="text-gray-600 text-lg">
            View your order history and receive status updates via email
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold mb-4">Ready to Order?</h2>
            <p className="text-xl mb-6">
              Browse our extensive catalog of wholesale products from trusted vendors across the country.
            </p>
            <Link to="/products" className="btn-secondary inline-block">
              View All Products
            </Link>
          </div>
          <div className="text-center md:text-right">
            {cartCount > 0 && (
              <div className="bg-white text-primary-700 rounded-xl p-6 inline-block">
                <p className="text-lg mb-2">Items in Cart</p>
                <p className="text-5xl font-bold">{cartCount}</p>
                <Link to="/cart" className="text-primary-600 font-semibold mt-4 inline-block hover:underline">
                  View Cart →
                </Link>
              </div>
            )}
            {cartCount === 0 && (
              <div className="text-center">
                <p className="text-xl opacity-75">Your cart is empty</p>
                <p className="text-lg opacity-60 mt-2">Start adding products to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Section for Seniors */}
      <div className="mt-16 card bg-amber-50 border-2 border-amber-200">
        <h2 className="text-2xl font-semibold text-amber-900 mb-4">Need Help?</h2>
        <div className="space-y-3 text-lg text-amber-800">
          <p><strong>Step 1:</strong> Browse products by clicking "Browse Products" or "Products" in the menu</p>
          <p><strong>Step 2:</strong> Click "Add to Cart" on products you want to order</p>
          <p><strong>Step 3:</strong> Go to your "Cart" and review your items</p>
          <p><strong>Step 4:</strong> Click "Submit Order" to place your order</p>
          <p><strong>Step 5:</strong> Check "My Orders" to see your order history and status</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
