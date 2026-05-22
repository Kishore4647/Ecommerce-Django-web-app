import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api/services';
import { Package, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    ordersAPI.list(params)
      .then(res => setOrders(res.data.results || res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input w-40 text-sm">
          <option value="">All Orders</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h2>
          <Link to="/products" className="btn-primary inline-block mt-2">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Package size={22} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">#{order.order_number}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.items?.length || 0} item(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{Number(order.total_amount).toLocaleString()}</p>
                  <span className={`badge mt-1 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
