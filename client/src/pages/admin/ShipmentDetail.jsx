import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Loading, Button } from '../../components/common';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    label_created: 'bg-blue-100 text-blue-800',
    ready_for_pickup: 'bg-indigo-100 text-indigo-800',
    picked_up: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-cyan-100 text-cyan-800',
    out_for_delivery: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    returned: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const AdminShipmentDetail = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/shipments/${id}`);
      setShipment(response.data.shipment || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/admin/shipments" className="text-primary-600 hover:underline">
          Back to Shipments
        </Link>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Shipment Not Found</h1>
        <Link to="/admin/shipments" className="text-primary-600 hover:underline">
          Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4">
            <Link to="/admin/shipments" className="text-gray-500 hover:text-gray-700">
              &larr; Back
            </Link>
            <h1 className="text-2xl font-bold">
              Shipment #{shipment.courier?.trackingNumber || shipment._id?.slice(-8)}
            </h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="text-gray-500 mt-1">
            Created {new Date(shipment.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courier Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Courier Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Courier</p>
                <p className="font-medium">{shipment.courier?.name || 'Manual'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-medium">{shipment.courier?.trackingNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium capitalize">{shipment.serviceType || 'Standard'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={shipment.status} />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Package Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-medium">{shipment.package?.weight || 0} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dimensions</p>
                <p className="font-medium">
                  {shipment.package?.dimensions?.length || 0} x{' '}
                  {shipment.package?.dimensions?.width || 0} x{' '}
                  {shipment.package?.dimensions?.height || 0} cm
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Items</p>
                <p className="font-medium">{shipment.package?.itemCount || 1} item(s)</p>
              </div>
              {shipment.isCOD && (
                <div>
                  <p className="text-sm text-gray-500">COD Amount</p>
                  <p className="font-medium">Rs. {shipment.codAmount?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Origin</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{shipment.origin?.name}</p>
                <p>{shipment.origin?.address}</p>
                <p>{shipment.origin?.city}, {shipment.origin?.state}</p>
                <p>{shipment.origin?.postalCode}</p>
                <p>Phone: {shipment.origin?.phone}</p>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Destination</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{shipment.destination?.name}</p>
                <p>{shipment.destination?.address}</p>
                <p>{shipment.destination?.city}, {shipment.destination?.state}</p>
                <p>{shipment.destination?.postalCode}</p>
                <p>Phone: {shipment.destination?.phone}</p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {shipment.specialInstructions && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Special Instructions</h2>
              <p className="text-gray-600">{shipment.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Link */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Related Order</h3>
            {shipment.subOrder && (
              <Link
                to={`/admin/orders/${shipment.order || shipment.subOrder}`}
                className="text-primary-600 hover:underline"
              >
                View Order
              </Link>
            )}
          </div>

          {/* Vendor Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Vendor</h3>
            <p className="text-gray-600">{shipment.vendor?.storeName || 'N/A'}</p>
          </div>

          {/* Costs */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Costs</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>Rs. {shipment.shippingCost?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Insurance</span>
                <span>Rs. {shipment.insuranceCost?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>Rs. {shipment.totalCost?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(shipment.createdAt).toLocaleDateString()}</span>
              </div>
              {shipment.pickedUpAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Picked Up</span>
                  <span>{new Date(shipment.pickedUpAt).toLocaleDateString()}</span>
                </div>
              )}
              {shipment.actualDelivery && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivered</span>
                  <span>{new Date(shipment.actualDelivery).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShipmentDetail;
