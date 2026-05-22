import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';

export default function CartPage() {
  const { cart, cartLoading, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Please login to view your cart</h2>
      <Link to="/login" className="btn-primary inline-block mt-4">Login</Link>
    </div>
  );

  if (cartLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="card h-28" />)}
    </div>
  );

  const items = cart?.items || [];

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Add some products to get started</p>
      <Link to="/products" className="btn-primary inline-flex items-center gap-2">
        Browse Products <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart ({cart.total_items} items)</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              {/* Image */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.product.main_image ? (
                  <img src={item.product.main_image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.slug}`}
                  className="font-medium text-gray-900 text-sm hover:text-blue-600 line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="text-blue-600 font-semibold mt-1">₹{Number(item.product.price).toLocaleString()}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => updateItem(item.id, item.quantity - 1)}
                  className="p-1.5 hover:bg-gray-50 rounded-l-lg">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="p-1.5 hover:bg-gray-50 rounded-r-lg">
                  <Plus size={14} />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">₹{Number(item.subtotal).toLocaleString()}</p>
                <button onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 mt-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({cart.total_items} items)</span>
              <span>₹{Number(cart.total_price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={Number(cart.total_price) > 500 ? 'text-green-600' : ''}>
                {Number(cart.total_price) > 500 ? 'FREE' : '₹50'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (18% GST)</span>
              <span>₹{(Number(cart.total_price) * 0.18).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>₹{(Number(cart.total_price) * 1.18 + (Number(cart.total_price) > 500 ? 0 : 50)).toFixed(2)}</span>
            </div>
          </div>
          {Number(cart.total_price) <= 500 && (
            <p className="text-xs text-blue-600 mt-3 bg-blue-50 p-2 rounded-lg">
              Add ₹{(500 - Number(cart.total_price)).toFixed(2)} more for free shipping!
            </p>
          )}
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <Link to="/products" className="btn-secondary w-full mt-2 text-center block text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
