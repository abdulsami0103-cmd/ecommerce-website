import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import vendorService from '../../services/vendorService';
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

const ShoppingBagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const Vendors = () => {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchVendors();
  }, [pagination.page]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getVendors({ page: pagination.page });
      setVendors(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading && vendors.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.vendors')}</h1>
          <p className="text-gray-500">{pagination.total} vendors found</p>
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No vendors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor._id}
              to={`/vendor/${vendor.storeSlug}`}
              className="card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"
                style={
                  vendor.banner
                    ? { backgroundImage: `url(${vendor.banner})`, backgroundSize: 'cover' }
                    : {}
                }
              />

              <div className="p-4">
                <div className="flex gap-4">
                  <div className="-mt-12 w-20 h-20 bg-white rounded-lg shadow-md overflow-hidden border-4 border-white flex-shrink-0">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.storeName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-600">
                          {vendor.storeName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="font-semibold">{vendor.storeName}</h3>
                    {vendor.rating.count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">{renderStars(vendor.rating.average)}</div>
                        <span className="text-xs text-gray-500">({vendor.rating.count})</span>
                      </div>
                    )}
                  </div>
                </div>

                {vendor.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{vendor.description}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ShoppingBagIcon className="w-4 h-4" />
                    {vendor.productCount || 0} Products
                  </div>
                  <span className="text-primary-600 hover:underline">Visit Store</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

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
  );
};

export default Vendors;
