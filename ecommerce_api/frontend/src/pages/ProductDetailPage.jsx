import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api/services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Star, Package, ArrowLeft, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    productsAPI.detail(slug)
      .then(res => { setProduct(res.data); setLoading(false); })
      .catch(() => { toast.error('Product not found'); navigate('/products'); });
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); return; }
    await addToCart(product.id, quantity);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to leave a review'); return; }
    setSubmittingReview(true);
    try {
      await productsAPI.addReview(slug, reviewForm);
      toast.success('Review submitted!');
      const res = await productsAPI.detail(slug);
      setProduct(res.data);
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images.map(i => i.image)
    : [null];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package size={80} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === i ? 'border-blue-600' : 'border-gray-200'}`}>
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category?.name && (
            <span className="text-blue-600 text-sm font-medium uppercase tracking-wide">{product.category.name}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-3">{product.name}</h1>

          {/* Rating */}
          {product.avg_rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(product.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{product.avg_rating} ({product.review_count} reviews)</span>
            </div>
          )}

          <p className="text-3xl font-bold text-gray-900 mb-2">₹{Number(product.price).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${product.in_stock ? 'text-green-700' : 'text-red-700'}`}>
              {product.in_stock ? `${product.stock_quantity} in stock` : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity + Add to Cart */}
          {product.in_stock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q-1))}
                  className="p-2 hover:bg-gray-50 rounded-l-lg"><Minus size={14} /></button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock_quantity, q+1))}
                  className="p-2 hover:bg-gray-50 rounded-r-lg"><Plus size={14} /></button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                <ShoppingCart size={16} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Review list */}
          <div className="space-y-4">
            {product.reviews?.length > 0 ? product.reviews.map(review => (
              <div key={review.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{review.user_name || review.user_email}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            )) : <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>}
          </div>

          {/* Write a review */}
          {user && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewForm(f => ({...f, rating: s}))}>
                        <Star size={24} className={s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                  <input className="input" value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({...f, title: e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Comment</label>
                  <textarea className="input resize-none" rows={3} value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))} required />
                </div>
                <button type="submit" disabled={submittingReview} className="btn-primary w-full">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
