import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
let token = null;
let userId = null;

// Test user credentials - register a new user for testing
const testUser = {
  email: `carttest${Date.now()}@test.com`,
  password: 'Test123!',
  name: 'Cart Test User'
};

console.log('🧪 Testing Cart API Endpoints\n');

// Helper function for API calls
async function apiCall(method, endpoint, body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (useAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// Test 1: Register a new user
async function test1_registerUser() {
  console.log('1️⃣  Testing: POST /auth/register');
  const result = await apiCall('POST', '/auth/register', testUser);

  if (result.status === 201 || result.status === 200) {
    token = result.data.token;
    userId = result.data.user?.id;
    console.log('✅ User registered successfully');
    console.log('   Token:', token?.substring(0, 20) + '...');
    console.log('   User ID:', userId);
  } else {
    // User might already exist, try login
    console.log('⚠️  Registration failed, trying login...');
    const loginResult = await apiCall('POST', '/auth/login', {
      email: 'testbuyer@test.com',
      password: 'test123'
    });

    if (loginResult.status === 200) {
      token = loginResult.data.token;
      userId = loginResult.data.user?.id;
      console.log('✅ Logged in successfully');
      console.log('   Token:', token?.substring(0, 20) + '...');
      console.log('   User ID:', userId);
    } else {
      console.log('❌ Both registration and login failed');
      console.log('   Error:', loginResult.data);
      process.exit(1);
    }
  }
  console.log('');
}

// Test 2: Get empty cart
async function test2_getEmptyCart() {
  console.log('2️⃣  Testing: GET /cart (empty cart)');
  const result = await apiCall('GET', '/cart', null, true);

  if (result.status === 200 && Array.isArray(result.data.cart)) {
    console.log('✅ Cart retrieved successfully');
    console.log('   Items in cart:', result.data.cart.length);
  } else {
    console.log('❌ Failed to get cart');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 3: Add item to cart
async function test3_addToCart() {
  console.log('3️⃣  Testing: POST /cart/add');

  const cartItem = {
    product_id: 1,
    product_name: 'Test Product',
    vendor_name: 'Test Vendor',
    quantity: 5,
    pricing_mode: 'case',
    unit_price: 10.50,
    case_price: 100.00,
    unavailable_action: 'curate',
    replacement_product_id: null,
    replacement_product_name: null
  };

  const result = await apiCall('POST', '/cart/add', cartItem, true);

  if (result.status === 201) {
    console.log('✅ Item added to cart successfully');
    console.log('   Cart Item ID:', result.data.cartItem?.id);
    console.log('   Product:', result.data.cartItem?.product_name);
    console.log('   Quantity:', result.data.cartItem?.quantity);
    console.log('   Amount:', result.data.cartItem?.amount);
    console.log('   Status:', result.data.cartItem?.status);
    return result.data.cartItem?.id;
  } else {
    console.log('❌ Failed to add item to cart');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 4: Add duplicate item (should increase quantity)
async function test4_addDuplicateItem() {
  console.log('4️⃣  Testing: POST /cart/add (duplicate item)');

  const cartItem = {
    product_id: 1,
    product_name: 'Test Product',
    vendor_name: 'Test Vendor',
    quantity: 3,
    pricing_mode: 'case',
    unit_price: 10.50,
    case_price: 100.00,
    unavailable_action: 'curate'
  };

  const result = await apiCall('POST', '/cart/add', cartItem, true);

  if (result.status === 201) {
    console.log('✅ Duplicate item handled successfully');
    console.log('   New Quantity:', result.data.cartItem?.quantity, '(should be 8: 5 + 3)');
    console.log('   New Amount:', result.data.cartItem?.amount);
  } else {
    console.log('❌ Failed to handle duplicate item');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 5: Get cart with items
async function test5_getCartWithItems() {
  console.log('5️⃣  Testing: GET /cart (with items)');
  const result = await apiCall('GET', '/cart', null, true);

  if (result.status === 200 && Array.isArray(result.data.cart)) {
    console.log('✅ Cart with items retrieved successfully');
    console.log('   Items in cart:', result.data.cart.length);
    result.data.cart.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.product_name} (qty: ${item.quantity}, status: ${item.status})`);
    });
    return result.data.cart[0]?.id;
  } else {
    console.log('❌ Failed to get cart');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 6: Update cart item
async function test6_updateCartItem(cartItemId) {
  console.log('6️⃣  Testing: PATCH /cart/:id');

  if (!cartItemId) {
    console.log('⚠️  Skipped: No cart item ID available');
    console.log('');
    return;
  }

  const updates = {
    quantity: 10,
    unavailable_action: 'replace_same_vendor',
    replacement_product_id: 2,
    replacement_product_name: 'Replacement Product'
  };

  const result = await apiCall('PATCH', `/cart/${cartItemId}`, updates, true);

  if (result.status === 200) {
    console.log('✅ Cart item updated successfully');
    console.log('   New Quantity:', result.data.cartItem?.quantity);
    console.log('   Unavailable Action:', result.data.cartItem?.unavailable_action);
    console.log('   Replacement Product:', result.data.cartItem?.replacement_product_name);
  } else {
    console.log('❌ Failed to update cart item');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 7: Add another product to cart
async function test7_addAnotherProduct() {
  console.log('7️⃣  Testing: POST /cart/add (second product)');

  const cartItem = {
    product_id: 2,
    product_name: 'Another Test Product',
    vendor_name: 'Another Vendor',
    quantity: 2,
    pricing_mode: 'unit',
    unit_price: 5.00,
    case_price: 50.00,
    unavailable_action: 'remove'
  };

  const result = await apiCall('POST', '/cart/add', cartItem, true);

  if (result.status === 201) {
    console.log('✅ Second product added to cart');
    console.log('   Cart Item ID:', result.data.cartItem?.id);
    return result.data.cartItem?.id;
  } else {
    console.log('❌ Failed to add second product');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 8: Delete cart item
async function test8_deleteCartItem(cartItemId) {
  console.log('8️⃣  Testing: DELETE /cart/:id');

  if (!cartItemId) {
    console.log('⚠️  Skipped: No cart item ID available');
    console.log('');
    return;
  }

  const result = await apiCall('DELETE', `/cart/${cartItemId}`, null, true);

  if (result.status === 200) {
    console.log('✅ Cart item deleted successfully');
    console.log('   Message:', result.data.message);
  } else {
    console.log('❌ Failed to delete cart item');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 9: Clear cart
async function test9_clearCart() {
  console.log('9️⃣  Testing: DELETE /cart/clear/all');

  const result = await apiCall('DELETE', '/cart/clear/all', null, true);

  if (result.status === 200) {
    console.log('✅ Cart cleared successfully');
    console.log('   Items removed:', result.data.itemsRemoved);
  } else {
    console.log('❌ Failed to clear cart');
    console.log('   Response:', result.data);
  }
  console.log('');
}

// Test 10: Verify cart is empty
async function test10_verifyEmptyCart() {
  console.log('🔟 Testing: GET /cart (verify empty)');
  const result = await apiCall('GET', '/cart', null, true);

  if (result.status === 200 && result.data.cart.length === 0) {
    console.log('✅ Cart is empty as expected');
  } else {
    console.log('❌ Cart should be empty');
    console.log('   Items in cart:', result.data.cart.length);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  try {
    await test1_registerUser();
    await test2_getEmptyCart();
    const firstItemId = await test3_addToCart();
    await test4_addDuplicateItem();
    const cartItemId = await test5_getCartWithItems();
    await test6_updateCartItem(cartItemId || firstItemId);
    const secondItemId = await test7_addAnotherProduct();
    await test8_deleteCartItem(secondItemId);
    await test9_clearCart();
    await test10_verifyEmptyCart();

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

runTests();
