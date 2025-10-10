import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HomePage = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="page-title mb-4 text-primary-900">
          Welcome to Cureate Connect
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
          Your gateway to local procurement. Connect with diverse vendors, discover unique products, and support your community's food economy through our streamlined ordering platform.
        </p>
        <Link to="/products" className="btn-primary inline-block">
          Browse Local Products
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-primary-900">Local Vendors</h3>
          <p className="text-gray-600 text-lg">
            Support diverse, women-owned, and BIPOC-owned local businesses
          </p>
        </div>

        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-primary-900">Streamlined Ordering</h3>
          <p className="text-gray-600 text-lg">
            Simplified procurement process for institutional buyers
          </p>
        </div>

        <div className="card text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-primary-900">Track Impact</h3>
          <p className="text-gray-600 text-lg">
            Monitor your contribution to the local economy
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card bg-gradient-to-r from-primary-700 to-primary-800 text-white">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold mb-4">Start Supporting Local</h2>
            <p className="text-xl mb-6 text-primary-100">
              Discover products from over 350 local small businesses, with 35% BIPOC-owned and 50% women-owned vendors.
            </p>
            <Link to="/products" className="btn-secondary inline-block">
              Explore Local Products
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

      {/* About Cureate Connect Section */}
      <div className="mt-16 card bg-cream border-2 border-primary-200">
        <h2 className="text-3xl font-display font-bold text-primary-900 mb-6">About Cureate Connect</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-primary-800 mb-3">Our Mission</h3>
            <p className="text-gray-700 mb-4">
              Cureate Connect empowers local small businesses by creating strategic procurement opportunities
              and providing comprehensive business support. We serve as a bridge between institutional buyers
              and diverse local vendors.
            </p>
            <h3 className="text-xl font-semibold text-primary-800 mb-3">What We Do</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Centralize supplier communications for institutional buyers
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Provide vendors with new business opportunities
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Offer strategic marketing and business consulting
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-primary-800 mb-3">Our Impact</h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary-700">350+</p>
                  <p className="text-sm text-gray-600">Local Businesses</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-700">35%</p>
                  <p className="text-sm text-gray-600">BIPOC-Owned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-700">50%+</p>
                  <p className="text-sm text-gray-600">Women-Owned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-700">100%</p>
                  <p className="text-sm text-gray-600">Local Impact</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700">
              Our platform serves as "match.com for new business," connecting local food producers,
              CPG businesses, farmers, bakers, and caterers with anchor institutions, hospitals,
              universities, and corporate offices.
            </p>
          </div>
        </div>
      </div>

      {/* Help Section for Seniors */}
      <div className="mt-8 card bg-primary-50 border-2 border-primary-300">
        <h2 className="text-2xl font-semibold text-primary-900 mb-4">How to Place an Order</h2>
        <div className="space-y-3 text-lg text-gray-700">
          <p className="flex items-start">
            <span className="font-semibold text-primary-700 mr-2">Step 1:</span>
            Browse products by clicking "Browse Local Products" or "Products" in the menu
          </p>
          <p className="flex items-start">
            <span className="font-semibold text-primary-700 mr-2">Step 2:</span>
            Click "Add to Cart" on products you want to order from local vendors
          </p>
          <p className="flex items-start">
            <span className="font-semibold text-primary-700 mr-2">Step 3:</span>
            Go to your "Cart" and review your selected items
          </p>
          <p className="flex items-start">
            <span className="font-semibold text-primary-700 mr-2">Step 4:</span>
            Click "Submit Order" to place your order with local businesses
          </p>
          <p className="flex items-start">
            <span className="font-semibold text-primary-700 mr-2">Step 5:</span>
            Check "My Orders" to track your order history and status
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
