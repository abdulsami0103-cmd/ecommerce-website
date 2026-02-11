import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import orderService from '../../services/orderService';
import { Loading, Price } from '../../components/common';

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders({ page: pagination.page });
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
    return badges[status] || 'badge-info';
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="text-primary-600 hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                  <span className={`badge ${getStatusBadge(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  <Price amount={order.totals.total} className="font-semibold" />
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {order.items.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 min-w-[200px]">
                    <img src={item.image || 'https://placehold.co/60'} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 4 && <div className="flex items-center text-gray-500 text-sm">+{order.items.length - 4} more</div>}
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t">
                <Link to={`/orders/${order._id}`} className="flex items-center text-primary-600 hover:text-primary-700">
                  <EyeIcon className="w-5 h-5 mr-1" />
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {[...Array(pagination.pages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setPagination({ ...pagination, page: index + 1 })}
              className={`px-4 py-2 rounded-lg ${pagination.page === index + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
