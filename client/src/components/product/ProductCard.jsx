import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addToCart } from '../../store/slices/cartSlice';
import { Button, Price } from '../common';
import toast from 'react-hot-toast';

// Inline SVG Icons
const StarIcon = ({ className, filled }) => (
  filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
);

const ShoppingCartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <StarIcon
        key={index}
        className="w-4 h-4 text-yellow-400"
        filled={index < Math.floor(rating)}
      />
    ));
  };

  const isOnSale = product.price.compareAt && product.price.compareAt > product.price.amount;
  const discountPercent = isOnSale
    ? Math.round((1 - product.price.amount / product.price.compareAt) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card group overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0] || 'https://placehold.co/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isOnSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}
        {product.type === 'digital' && (
          <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Digital
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Vendor */}
        {product.vendor?.storeName && (
          <p className="text-xs text-gray-500 mb-1">{product.vendor.storeName}</p>
        )}

        {/* Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating?.count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">{renderStars(product.rating.average)}</div>
            <span className="text-xs text-gray-500">({product.rating.count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <Price amount={product.price.amount} className="text-lg font-bold text-primary-600" />
          {isOnSale && (
            <Price amount={product.price.compareAt} className="text-sm text-gray-400 line-through" />
          )}
        </div>

        {/* Add to Cart */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddToCart}
          disabled={product.type === 'physical' && product.inventory?.quantity === 0}
        >
          <ShoppingCartIcon className="w-4 h-4 mr-2" />
          {product.inventory?.quantity === 0
            ? t('product.outOfStock')
            : t('product.addToCart')}
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
