import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();   // Don't navigate to product page when clicking button
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    await addToCart(product.id);
  };

  return (
    <Link to={`/products/${product.slug}`} className="card group hover:shadow-md transition-shadow flex flex-col">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart size={48} />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {product.category_name && (
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
            {product.category_name}
          </span>
        )}
        <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2 line-clamp-2 flex-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-lg font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</p>
            {!product.in_stock && (
              <span className="badge bg-red-100 text-red-700 text-xs">Out of Stock</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <ShoppingCart size={13} />
            Add
          </button>
        </div>
      </div>
    </Link>
  );
}
