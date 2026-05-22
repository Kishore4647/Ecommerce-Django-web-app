import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../api/services';
import ProductCard from '../components/products/ProductCard';
import { ArrowRight, ShoppingBag, Truck, Shield, Headphones } from 'lucide-react';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.featured(),
      categoriesAPI.list(),
    ]).then(([featRes, catRes]) => {
      setFeatured(featRes.data.slice(0, 8));
      setCategories(catRes.data.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Shop Smarter, <br />
            <span className="text-blue-200">Not Harder</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Thousands of products, fast delivery, easy returns.
          </p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors">
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, label: 'Free Shipping', sub: 'Orders above ₹500' },
            { icon: Shield, label: 'Secure Payment', sub: '100% Protected' },
            { icon: ShoppingBag, label: 'Easy Returns', sub: '7-day policy' },
            { icon: Headphones, label: '24/7 Support', sub: 'Always here' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.id}`}
                className="card p-4 text-center hover:shadow-md transition-shadow hover:border-blue-200 group">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cat.product_count} items</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No products yet. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
}
