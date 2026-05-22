import React, { useEffect, useState } from 'react';
import { ordersAPI, inventoryAPI } from '../api/services';
import { Package, AlertTriangle, ShoppingBag, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState({ products: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [adjustForm, setAdjustForm] = useState({
    product_id: '', quantity_change: '', adjustment_type: 'restock', notes: ''
  });
  const [adjusting, setAdjusting] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    Promise.all([
      ordersAPI.list(),
      inventoryAPI.lowStock(),
    ]).then(([ordRes, stockRes]) => {
      setOrders(ordRes.data.results || ordRes.data);
      setLowStock(stockRes.data);
    }).catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      await inventoryAPI.adjust({
        ...adjustForm,
        product_id: Number(adjustForm.product_id),
        quantity_change: Number(adjustForm.quantity_change),
      });
      toast.success('Stock adjusted successfully!');
      setAdjustForm({ product_id: '', quantity_change: '', adjustment_type: 'restock', notes: '' });
      const res = await inventoryAPI.lowStock();
      setLowStock(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const res = await ordersAPI.updateStatus(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      toast.success(`Order updated to "${newStatus}"`);
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
    </div>
  );

  const totalRevenue = orders.filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
          { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length, icon: Package, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Low Stock Items', value: lowStock.count, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Management */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">All Orders</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No orders yet</div>
              ) : orders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-sm text-gray-900">#{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.user_email}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">₹{Number(order.total_amount).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <select
                      value={order.status}
                      disabled={updatingOrder === order.id}
                      onChange={e => handleStatusUpdate(order.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Low Stock Alert */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="font-semibold text-gray-900">Low Stock ({lowStock.count})</h2>
            </div>
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {lowStock.products?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">All stock levels OK ✓</p>
              ) : lowStock.products?.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800 text-xs truncate max-w-32">{p.name}</p>
                    <p className="text-gray-400 text-xs">{p.sku}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-700 text-xs">{p.stock_quantity} left</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Adjustment */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Adjust Stock</h2>
            <form onSubmit={handleStockAdjust} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Product ID</label>
                <input type="number" required className="input text-sm"
                  placeholder="e.g. 3"
                  value={adjustForm.product_id}
                  onChange={e => setAdjustForm(f => ({ ...f, product_id: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Quantity Change</label>
                <input type="number" required className="input text-sm"
                  placeholder="+50 or -10"
                  value={adjustForm.quantity_change}
                  onChange={e => setAdjustForm(f => ({ ...f, quantity_change: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                <select className="input text-sm"
                  value={adjustForm.adjustment_type}
                  onChange={e => setAdjustForm(f => ({ ...f, adjustment_type: e.target.value }))}>
                  <option value="restock">Restock</option>
                  <option value="damage">Damage/Loss</option>
                  <option value="return">Customer Return</option>
                  <option value="correction">Manual Correction</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <input className="input text-sm" placeholder="Optional"
                  value={adjustForm.notes}
                  onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" disabled={adjusting} className="btn-primary w-full text-sm">
                {adjusting ? 'Adjusting...' : 'Apply Adjustment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
