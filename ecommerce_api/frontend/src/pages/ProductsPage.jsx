import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../api/services';
import ProductCard from '../components/products/ProductCard';
import { Search, Filter, X } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    categoriesAPI.list().then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (ordering) params.ordering = ordering;
    if (inStockOnly) params.in_stock = true;

    setLoading(true);
    productsAPI.list(params)
      .then(res => setProducts(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, [search, selectedCategory, minPrice, maxPrice, ordering, inStockOnly]);

  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setMinPrice(''); setMaxPrice(''); setInStockOnly(false);
  };

  const hasFilters = search || selectedCategory || minPrice || maxPrice || inStockOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="card p-5 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Filter size={16} /> Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
              <div className="mt-2 space-y-1">
                <button onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}>
                  All Categories
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(String(cat.id))}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${selectedCategory === String(cat.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}>
                    {cat.name} <span className="text-gray-400">({cat.product_count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price Range</label>
              <div className="mt-2 flex gap-2">
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="input text-sm" />
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="input text-sm" />
              </div>
            </div>

            {/* In Stock */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search + Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search products..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9" />
            </div>
            <select value={ordering} onChange={e => setOrdering(e.target.value)}
              className="input w-full sm:w-48">
              <option value="-created_at">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-stock_quantity">Most Stock</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array(9).fill(0).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">{products.length} products found</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Search size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">Try different search terms or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
