import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../api/services';
import { CheckCircle, CreditCard, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'India',
    payment_method: 'cod',
    notes: '',
  });

  useEffect(() => { if (user) fetchCart(); }, [user]);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ordersAPI.checkout(form);
      setOrderId(res.data.id);
      toast.success('Order placed successfully!');
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Order Success ────────────────────────────────────────────────────────────
  if (orderId) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <CheckCircle size={72} className="mx-auto text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-gray-500 mb-6">
        Your order has been confirmed. You'll receive a confirmation email shortly.
      </p>
      <div className="flex flex-col gap-3">
        <button onClick={() => navigate(`/orders/${orderId}`)} className="btn-primary">
          View Order Details
        </button>
        <button onClick={() => navigate('/products')} className="btn-secondary">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const items = cart?.items || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Truck size={18} className="text-blue-600" /> Shipping Address
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Street Address *</label>
                <textarea className="input resize-none" rows={2} required
                  value={form.shipping_address} onChange={update('shipping_address')}
                  placeholder="123 Main St, Apt 4B" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">City *</label>
                  <input className="input" required value={form.shipping_city}
                    onChange={update('shipping_city')} placeholder="Chennai" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">State *</label>
                  <input className="input" required value={form.shipping_state}
                    onChange={update('shipping_state')} placeholder="Tamil Nadu" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">PIN Code *</label>
                  <input className="input" required value={form.shipping_zip}
                    onChange={update('shipping_zip')} placeholder="600001" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Country</label>
                  <input className="input" value={form.shipping_country} onChange={update('shipping_country')} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-blue-600" /> Payment Method
            </h2>
            <div className="space-y-2">
              {[
                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                { value: 'wallet', label: 'Digital Wallet', desc: 'UPI, PhonePe, Paytm' },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors
                    ${form.payment_method === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={form.payment_method === opt.value}
                    onChange={update('payment_method')}
                    className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Order Notes (optional)</label>
            <textarea className="input resize-none" rows={2}
              value={form.notes} onChange={update('notes')}
              placeholder="Special delivery instructions..." />
          </div>

          <button type="submit" disabled={loading || items.length === 0}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</>
            ) : (
              <>Place Order — ₹{cart ? (Number(cart.total_price) * 1.18 + (Number(cart.total_price) > 500 ? 0 : 50)).toFixed(2) : 0}</>
            )}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="card p-5 h-fit sticky top-24">
          <h3 className="font-semibold text-gray-900 mb-4">Your Order ({items.length} items)</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400">x{item.quantity}</p>
                </div>
                <p className="text-xs font-semibold text-gray-900">₹{Number(item.subtotal).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{Number(cart?.total_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>{Number(cart?.total_price) > 500 ? 'FREE' : '₹50'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST (18%)</span>
              <span>₹{(Number(cart?.total_price || 0) * 0.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>₹{cart ? (Number(cart.total_price) * 1.18 + (Number(cart.total_price) > 500 ? 0 : 50)).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
