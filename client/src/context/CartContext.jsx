import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../config/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'

  // Load cart from DATABASE on mount and when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        // Guest users: load from localStorage
        const guestCart = localStorage.getItem('cart_guest');
        if (guestCart) {
          try {
            setCart(JSON.parse(guestCart));
          } catch (error) {
            console.error('Error loading guest cart:', error);
            setCart([]);
          }
        } else {
          setCart([]);
        }
        return;
      }

      // Authenticated users: load from database
      setLoading(true);
      try {
        const response = await api.get('/api/cart');
        const dbCart = response.data.cart || [];

        // Map database cart items to match frontend structure
        const mappedCart = dbCart.map(item => ({
          id: item.product_id, // Use product_id as the cart item identifier
          cartItemId: item.id, // Store database order ID for updates/deletes
          product_name: item.product_name,
          vendor_name: item.vendor_name,
          quantity: item.quantity,
          pricing_mode: item.pricing_mode || 'case',
          wholesale_unit_price: item.unit_price,
          wholesale_case_price: item.case_price,
          amount: item.amount,
          unavailable_action: item.unavailable_action || 'curate',
          replacement_product_id: item.replacement_product_id,
          replacement_product_name: item.replacement_product_name,
          cart_created_at: item.cart_created_at,
          // Validation fields
          is_split_case: item.is_split_case,
          case_pack: item.case_pack,
          minimum_units: item.minimum_units,
          case_minimum: item.case_minimum,
          minimum_cost: item.minimum_cost,
          product_image: item.product_image,
          // Keep any other fields from database
          ...item
        }));

        setCart(mappedCart);

        // Also save to localStorage as backup
        localStorage.setItem(`cart_${user.email}`, JSON.stringify(mappedCart));
      } catch (error) {
        console.error('Error loading cart from database:', error);

        // Fallback to localStorage if database fails
        const localCart = localStorage.getItem(`cart_${user.email}`);
        if (localCart) {
          try {
            setCart(JSON.parse(localCart));
          } catch (err) {
            console.error('Error loading cart from localStorage:', err);
            setCart([]);
          }
        } else {
          setCart([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to localStorage whenever it changes (backup)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart_guest', JSON.stringify(cart));
    } else {
      localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  const addToCart = async (product, quantity = 1, pricingMode = 'case', unavailableAction = 'curate', replacementProductId = null, replacementProductName = null) => {
    if (!user) {
      // Guest users: localStorage only
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);

        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  pricing_mode: pricingMode,
                  unavailable_action: unavailableAction,
                  replacement_product_id: replacementProductId,
                  replacement_product_name: replacementProductName
                }
              : item
          );
        } else {
          return [...prevCart, {
            ...product,
            quantity,
            pricing_mode: pricingMode,
            unavailable_action: unavailableAction,
            replacement_product_id: replacementProductId,
            replacement_product_name: replacementProductName
          }];
        }
      });
      return;
    }

    // Authenticated users: sync to database
    try {
      setSyncStatus('syncing');

      const response = await api.post('/api/cart/add', {
        product_id: product.id,
        product_name: product.product_name,
        vendor_name: product.vendor_name,
        quantity,
        pricing_mode: pricingMode,
        unit_price: product.wholesale_unit_price,
        case_price: product.wholesale_case_price,
        unavailable_action: unavailableAction,
        replacement_product_id: replacementProductId,
        replacement_product_name: replacementProductName,
        // Validation fields
        is_split_case: product.is_split_case,
        case_pack: product.case_pack,
        minimum_units: product.minimum_units,
        case_minimum: product.case_minimum,
        minimum_cost: product.minimum_cost,
        product_image: product.product_image
      });

      const cartItem = response.data.cartItem;

      // Update local state with database response
      setCart(prevCart => {
        const existingIndex = prevCart.findIndex(item => item.id === product.id);

        const mappedItem = {
          id: cartItem.product_id,
          cartItemId: cartItem.id,
          product_name: cartItem.product_name,
          vendor_name: cartItem.vendor_name,
          quantity: cartItem.quantity,
          pricing_mode: cartItem.pricing_mode,
          wholesale_unit_price: cartItem.unit_price,
          wholesale_case_price: cartItem.case_price,
          amount: cartItem.amount,
          unavailable_action: cartItem.unavailable_action,
          replacement_product_id: cartItem.replacement_product_id,
          replacement_product_name: cartItem.replacement_product_name,
          // Validation fields
          is_split_case: cartItem.is_split_case,
          case_pack: cartItem.case_pack,
          minimum_units: cartItem.minimum_units,
          case_minimum: cartItem.case_minimum,
          minimum_cost: cartItem.minimum_cost,
          product_image: cartItem.product_image,
          ...cartItem
        };

        if (existingIndex >= 0) {
          const newCart = [...prevCart];
          newCart[existingIndex] = mappedItem;
          return newCart;
        } else {
          return [...prevCart, mappedItem];
        }
      });

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setSyncStatus('error');

      // Fallback: update localStorage only
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);

        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevCart, {
            ...product,
            quantity,
            pricing_mode: pricingMode,
            unavailable_action: unavailableAction,
            replacement_product_id: replacementProductId,
            replacement_product_name: replacementProductName
          }];
        }
      });
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) {
      // Guest users: localStorage only
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    // Authenticated users: sync to database
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem || !cartItem.cartItemId) {
      // Item not in database yet or no cartItemId, just remove locally
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    try {
      setSyncStatus('syncing');

      await api.delete(`/api/cart/${cartItem.cartItemId}`);

      // Update local state
      setCart(prevCart => prevCart.filter(item => item.id !== productId));

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error removing from cart:', error);
      setSyncStatus('error');

      // Still remove locally as fallback
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (!user) {
      // Guest users: localStorage only
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
      return;
    }

    // Authenticated users: sync to database
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem || !cartItem.cartItemId) {
      // Item not in database yet, just update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
      return;
    }

    try {
      setSyncStatus('syncing');

      const response = await api.patch(`/api/cart/${cartItem.cartItemId}`, {
        quantity
      });

      const updatedItem = response.data.cartItem;

      // Update local state with database response
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                quantity: updatedItem.quantity,
                amount: updatedItem.amount
              }
            : item
        )
      );

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error updating quantity:', error);
      setSyncStatus('error');

      // Fallback: update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const updatePricingMode = async (productId, mode) => {
    if (!user) {
      // Guest users: localStorage only
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, pricing_mode: mode }
            : item
        )
      );
      return;
    }

    // Authenticated users: sync to database
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem || !cartItem.cartItemId) {
      // Item not in database yet, just update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, pricing_mode: mode }
            : item
        )
      );
      return;
    }

    try {
      setSyncStatus('syncing');

      const response = await api.patch(`/api/cart/${cartItem.cartItemId}`, {
        pricing_mode: mode
      });

      const updatedItem = response.data.cartItem;

      // Update local state
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                pricing_mode: updatedItem.pricing_mode,
                amount: updatedItem.amount
              }
            : item
        )
      );

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error updating pricing mode:', error);
      setSyncStatus('error');

      // Fallback: update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, pricing_mode: mode }
            : item
        )
      );
    }
  };

  const updateReplacementPreference = async (productId, unavailableAction, replacementProductId, replacementProductName = null) => {
    if (!user) {
      // Guest users: localStorage only
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                unavailable_action: unavailableAction,
                replacement_product_id: replacementProductId,
                replacement_product_name: replacementProductName
              }
            : item
        )
      );
      return;
    }

    // Authenticated users: sync to database
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem || !cartItem.cartItemId) {
      // Item not in database yet, just update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                unavailable_action: unavailableAction,
                replacement_product_id: replacementProductId,
                replacement_product_name: replacementProductName
              }
            : item
        )
      );
      return;
    }

    try {
      setSyncStatus('syncing');

      const response = await api.patch(`/api/cart/${cartItem.cartItemId}`, {
        unavailable_action: unavailableAction,
        replacement_product_id: replacementProductId,
        replacement_product_name: replacementProductName
      });

      const updatedItem = response.data.cartItem;

      // Update local state
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                unavailable_action: updatedItem.unavailable_action,
                replacement_product_id: updatedItem.replacement_product_id,
                replacement_product_name: updatedItem.replacement_product_name
              }
            : item
        )
      );

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error updating replacement preference:', error);
      setSyncStatus('error');

      // Fallback: update locally
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? {
                ...item,
                unavailable_action: unavailableAction,
                replacement_product_id: replacementProductId,
                replacement_product_name: replacementProductName
              }
            : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (!user) {
      // Guest users: localStorage only
      setCart([]);
      return;
    }

    // Authenticated users: sync to database
    try {
      setSyncStatus('syncing');

      await api.delete('/api/cart/clear/all');

      setCart([]);

      setSyncStatus('synced');
    } catch (error) {
      console.error('Error clearing cart:', error);
      setSyncStatus('error');

      // Fallback: clear locally
      setCart([]);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.pricing_mode === 'unit'
        ? (item.wholesale_unit_price || 0)
        : (item.wholesale_case_price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    syncStatus,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePricingMode,
    updateReplacementPreference,
    clearCart,
    getCartTotal,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
