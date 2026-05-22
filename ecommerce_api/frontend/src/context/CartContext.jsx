import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartAPI } from '../api/services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      setCartLoading(true);
      const res = await cartAPI.get();
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await cartAPI.addItem(productId, quantity);
      setCart(res.data);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const res = await cartAPI.updateItem(itemId, quantity);
      setCart(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart(null);
    } catch (err) {
      console.error(err);
    }
  };

  const cartCount = cart?.total_items || 0;

  return (
    <CartContext.Provider value={{ cart, cartLoading, cartCount, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
