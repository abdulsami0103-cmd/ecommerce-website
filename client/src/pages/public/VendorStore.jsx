import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import vendorService from '../../services/vendorService';
import productService from '../../services/productService';
import ProductGrid from '../../components/product/ProductGrid';
import { Loading, Button } from '../../components/common';

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

const MailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const VendorStore = () => {
  const { t } = useTranslation();
  const { slug } = useParams();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchVendor();
  }, [slug]);

  useEffect(() => {
    if (vendor) {
      fetchProducts();
    }
  }, [vendor, pagination.page]);

  const fetchVendor = async () => {
    try {
      const data = await vendorService.getVendor(slug);
      setVendor(data);
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productService.getVendorProducts(vendor._id, {
        page: pagination.page,
      });
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <StarIcon
        key={index}
        className="w-5 h-5 text-yellow-400"
        filled={index < Math.floor(rating)}
      />
    ));
  };

  if (loading) return <Loading fullScreen />;

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Vendor Not Found</h2>
        <Link to="/vendors" className="text-primary-600 hover:underline">
          Browse Vendors
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div
        className="h-48 md:h-64 bg-gradient-to-r from-primary-600 to-primary-800 relative"
        style={
          vendor.banner
            ? { backgroundImage: `url(${vendor.banner})`, backgroundSize: 'cover' }
            : {}
        }
      >
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-8">
          <div className="card p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 -mt-20 md:-mt-24 bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.storeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-600">{vendor.storeName.charAt(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
                    {vendor.rating.count > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex">{renderStars(vendor.rating.average)}</div>
                        <span className="text-gray-500">({vendor.rating.count} reviews)</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline">Contact Seller</Button>
                </div>

                {vendor.description && (
                  <p className="text-gray-600 mt-4">{vendor.description}</p>
                )}

                <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500">
                  {vendor.contactEmail && (
                    <div className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4" />
                      {vendor.contactEmail}
                    </div>
                  )}
                  {vendor.contactPhone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      {vendor.contactPhone}
                    </div>
                  )}
                  {vendor.address?.city && (
                    <div className="flex items-center gap-2">
                      <LocationIcon className="w-4 h-4" />
                      {vendor.address.city}, {vendor.address.country}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-4 text-sm">
                  <span className="text-gray-500">
                    <strong className="text-gray-900">{vendor.productCount}</strong> Products
                  </span>
                  <span className="text-gray-500">
                    Member since <strong className="text-gray-900">{new Date(vendor.createdAt).getFullYear()}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6">Products ({pagination.total || products.length})</h2>
          <ProductGrid products={products} loading={productsLoading} />

          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorStore;
