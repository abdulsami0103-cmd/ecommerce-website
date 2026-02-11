import { useState } from 'react';

/**
 * StatusTimeline - Reusable vertical timeline component
 */

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const statusConfig = {
  // Order statuses
  pending: { icon: ClockIcon, color: 'yellow', label: 'Pending' },
  confirmed: { icon: CheckIcon, color: 'teal', label: 'Confirmed' },
  processing: { icon: PackageIcon, color: 'emerald', label: 'Processing' },
  shipped: { icon: TruckIcon, color: 'purple', label: 'Shipped' },
  out_for_delivery: { icon: TruckIcon, color: 'teal', label: 'Out for Delivery' },
  delivered: { icon: CheckIcon, color: 'green', label: 'Delivered' },
  cancelled: { icon: XIcon, color: 'red', label: 'Cancelled' },
  returned: { icon: PackageIcon, color: 'orange', label: 'Returned' },

  // Shipment statuses
  label_created: { icon: PackageIcon, color: 'emerald', label: 'Label Created' },
  ready_for_pickup: { icon: PackageIcon, color: 'emerald', label: 'Ready for Pickup' },
  picked_up: { icon: TruckIcon, color: 'purple', label: 'Picked Up' },
  in_transit: { icon: TruckIcon, color: 'purple', label: 'In Transit' },
  attempted_delivery: { icon: TruckIcon, color: 'orange', label: 'Delivery Attempted' },
  failed: { icon: XIcon, color: 'red', label: 'Failed' },

  // Default
  default: { icon: ClockIcon, color: 'gray', label: 'Unknown' },
};

const colorClasses = {
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-300',
    line: 'bg-yellow-300',
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-300',
    line: 'bg-emerald-300',
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    border: 'border-teal-300',
    line: 'bg-teal-300',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-300',
    line: 'bg-purple-300',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-300',
    line: 'bg-green-300',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-300',
    line: 'bg-red-300',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-300',
    line: 'bg-orange-300',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    line: 'bg-gray-300',
  },
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusTimeline = ({
  events = [],
  showAll = false,
  maxVisible = 5,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(showAll);

  if (events.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No status history available
      </div>
    );
  }

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) =>
    new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
  );

  const visibleEvents = expanded ? sortedEvents : sortedEvents.slice(0, maxVisible);
  const hasMore = sortedEvents.length > maxVisible;

  return (
    <div className="relative">
      <div className="space-y-0">
        {visibleEvents.map((event, index) => {
          const config = statusConfig[event.status] || statusConfig.default;
          const colors = colorClasses[config.color];
          const IconComponent = config.icon;
          const isLast = index === visibleEvents.length - 1;
          const isFirst = index === 0;

          return (
            <div key={event._id || index} className="relative flex gap-4">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-full ${colors.line}`}
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}

              {/* Icon */}
              <div
                className={`
                  relative z-10 flex-shrink-0 w-8 h-8 rounded-full
                  ${colors.bg} ${colors.border} border-2
                  flex items-center justify-center
                  ${isFirst ? 'ring-2 ring-offset-2 ring-' + config.color + '-300' : ''}
                `}
              >
                <IconComponent className={`w-4 h-4 ${colors.text}`} />
              </div>

              {/* Content */}
              <div className={`flex-1 ${compact ? 'pb-4' : 'pb-6'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-medium ${colors.text}`}>
                      {event.label || config.label}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        📍 {event.location}
                      </p>
                    )}
                    {event.note && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        "{event.note}"
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-500">
                      {formatDate(event.timestamp || event.createdAt)}
                    </p>
                    {event.createdBy && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {event.createdBy.name || event.createdBy}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less button */}
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          {expanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show less
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show {sortedEvents.length - maxVisible} more
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default StatusTimeline;
