import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { fetchProduct, clearProduct } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { Loading, Button, Price } from '../../components/common';

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

const MinusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const CartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const HeartIcon = ({ className, filled }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ProductDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const dispatch = useDispatch();

  const { product, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  useEffect(() => {
    dispatch(fetchProduct(slug));
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, slug]);

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity, variant: selectedVariant }));
    toast.success('Added to cart!');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      // Toggle wishlist state (API integration can be added later)
      setIsWishlisted(!isWishlisted);
      if (!isWishlisted) {
        toast.success('Added to wishlist!');
      } else {
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    const productUrl = window.location.href;
    const productTitle = product?.name || 'Check out this product';

    // Check if Web Share API is available (mobile/modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          text: `Check out ${productTitle} on MarketPlace!`,
          url: productUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          // User cancelled, not an error
          copyToClipboard(productUrl);
        }
      }
    } else {
      // Fallback: show share menu
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied to clipboard!');
      setShowShareMenu(false);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const shareToSocial = (platform) => {
    const productUrl = encodeURIComponent(window.location.href);
    const productTitle = encodeURIComponent(product?.name || 'Check out this product');

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${productUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${productTitle}&url=${productUrl}`,
      whatsapp: `https://wa.me/?text=${productTitle}%20${productUrl}`,
      telegram: `https://t.me/share/url?url=${productUrl}&text=${productTitle}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <StarIcon key={index} className="w-5 h-5 text-yellow-400" filled={index < Math.floor(rating)} />
    ));
  };

  if (loading) return <Loading fullScreen />;

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/products" className="text-primary-600 hover:underline">Browse Products</Link>
      </div>
    );
  }

  const isOnSale = product.price.compareAt && product.price.compareAt > product.price.amount;
  const inStock = product.type === 'digital' || !product.inventory?.trackInventory || product.inventory?.quantity > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            <img src={product.images?.[selectedImage] || 'https://placehold.co/600'} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.vendor && (
            <Link to={`/vendor/${product.vendor.storeSlug}`} className="text-sm text-primary-600 hover:underline mb-2 inline-block">
              {product.vendor.storeName}
            </Link>
          )}

          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {product.rating?.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{renderStars(product.rating.average)}</div>
              <span className="text-gray-500">{product.rating.average.toFixed(1)} ({product.rating.count} {t('product.reviews')})</span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <Price amount={product.price.amount} className="text-3xl font-bold text-primary-600" />
            {isOnSale && (
              <>
                <Price amount={product.price.compareAt} className="text-xl text-gray-400 line-through" />
                <span className="badge-success">Save {Math.round((1 - product.price.amount / product.price.compareAt) * 100)}%</span>
              </>
            )}
          </div>

          {product.shortDescription && <p className="text-gray-600 mb-6">{product.shortDescription}</p>}

          {product.variants?.length > 0 && (
            <div className="mb-6">
              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-4">
                  <h3 className="font-medium mb-2">{variant.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedVariant(option.value)}
                        className={`px-4 py-2 border rounded-lg ${selectedVariant === option.value ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        {option.value}
                        {option.priceModifier !== 0 && <span className="text-sm ml-1">({option.priceModifier > 0 ? '+' : ''}${option.priceModifier})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            {inStock ? (
              <>
                <CheckIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-600">{t('product.inStock')}</span>
                {product.inventory?.quantity && <span className="text-gray-500">({product.inventory.quantity} available)</span>}
              </>
            ) : (
              <span className="text-red-600">{t('product.outOfStock')}</span>
            )}
          </div>

          {inStock && (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-100">
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="px-6 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.inventory?.quantity || 99, quantity + 1))} className="p-3 hover:bg-gray-100">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              <Button onClick={handleAddToCart} className="flex-1">
                <CartIcon className="w-5 h-5 mr-2" />
                {t('product.addToCart')}
              </Button>

              <button
                onClick={handleWishlist}
                className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors ${isWishlisted ? 'bg-red-50 border-red-300' : ''}`}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <HeartIcon className={`w-5 h-5 ${isWishlisted ? 'text-red-500' : ''}`} filled={isWishlisted} />
              </button>

              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={handleShare}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                  title="Share product"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>

                {/* Share Menu Dropdown */}
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <button
                        onClick={() => copyToClipboard(window.location.href)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                      </button>
                      <button
                        onClick={() => shareToSocial('whatsapp')}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => shareToSocial('facebook')}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </button>
                      <button
                        onClick={() => shareToSocial('twitter')}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Twitter/X
                      </button>
                      <button
                        onClick={() => shareToSocial('telegram')}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <span className={`badge ${product.type === 'digital' ? 'badge-info' : 'badge-success'}`}>
              {product.type === 'digital' ? 'Digital Product' : 'Physical Product'}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            {product.category && (
              <p>Category: <Link to={`/products?category=${product.category.slug}`} className="text-primary-600 hover:underline">{product.category.name}</Link></p>
            )}
            {product.tags?.length > 0 && <p className="mt-1">Tags: {product.tags.join(', ')}</p>}
          </div>

          {/* Specs table extracted from description */}
          {product.description && (() => {
            const tableMatch = product.description.match(/<table[\s\S]*?<\/table>/i);
            if (tableMatch) {
              return (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <h3 className="font-semibold text-sm bg-gray-50 px-4 py-2 border-b">Specifications</h3>
                  <div
                    className="prose prose-sm max-w-none specs-table"
                    dangerouslySetInnerHTML={{ __html: tableMatch[0] }}
                  />
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">{t('product.description')}</h2>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: product.description
              ? product.description.replace(/<table[\s\S]*?<\/table>/i, '')
              : ''
          }}
        />
      </div>

      {product.type === 'physical' && product.shipping && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold mb-2">Shipping Information</h3>
          <p className="text-gray-600">
            Weight: {product.shipping.weight}kg
            {product.shipping.dimensions && (
              <span className="ml-4">Dimensions: {product.shipping.dimensions.length} x {product.shipping.dimensions.width} x {product.shipping.dimensions.height} cm</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
