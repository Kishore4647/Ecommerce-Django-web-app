import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api/services';
import { Package, ArrowLeft, XCircle, CheckCircle, Clock, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
  refunded:   'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersAPI.detail(id)
      .then(res => setOrder(res.data))
      .catch(() => { toast.error('Order not found'); navigate('/orders'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await ordersAPI.cancel(id);
      setOrder(res.data.order);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel this order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="card h-40" />
      <div className="card h-60" />
    </div>
  );
  if (!order) return null;

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge border px-3 py-1.5 text-sm font-medium ${STATUS_COLORS[order.status] || ''}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          {['pending', 'confirmed'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
              <XCircle size={14} />
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Status Tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0">
              <div className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${currentStepIdx >= 0 ? (currentStepIdx / (STATUS_STEPS.length - 1)) * 100 : 0}%` }} />
            </div>
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex flex-col items-center z-10 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                  ${idx <= currentStepIdx ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                  {idx < currentStepIdx ? <CheckCircle size={14} /> :
                   idx === currentStepIdx ? <Clock size={14} /> :
                   <span className="text-xs font-medium">{idx + 1}</span>}
                </div>
                <span className={`text-xs mt-1.5 font-medium capitalize text-center
                  ${idx <= currentStepIdx ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Shipping Address */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Truck size={16} className="text-blue-600" /> Shipping To
          </h3>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state}</p>
            <p>{order.shipping_zip}, {order.shipping_country}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Payment</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Method</span>
              <span className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Status</span>
              <span className={`font-medium capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment_status}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-1">
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Shipping</span><span>₹{Number(order.shipping_cost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>GST</span><span>₹{Number(order.tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1">
                <span>Total</span><span>₹{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Items Ordered</h3>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">₹{Number(item.subtotal).toLocaleString()}</p>
                <p className="text-xs text-gray-400">₹{Number(item.unit_price).toLocaleString()} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
