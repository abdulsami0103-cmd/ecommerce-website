const MobileCard = ({
  title,
  subtitle,
  meta,
  status,
  statusColor = 'gray',
  leftIcon,
  rightContent,
  onClick,
  className = '',
  children,
}) => {
  const statusColors = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full bg-white border-b border-gray-100 active:bg-gray-50 transition-colors ${
        onClick ? 'text-left' : ''
      } ${className}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Left Icon */}
        {leftIcon && (
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>
              )}
            </div>

            {/* Status Badge */}
            {status && (
              <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${statusColors[statusColor]}`}>
                {status}
              </span>
            )}
          </div>

          {/* Meta Info */}
          {meta && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {Array.isArray(meta) ? (
                meta.map((item, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {item.icon}
                    {item.text}
                  </span>
                ))
              ) : (
                meta
              )}
            </div>
          )}

          {/* Additional Content */}
          {children}
        </div>

        {/* Right Content (e.g., amount, chevron) */}
        {rightContent && (
          <div className="flex-shrink-0 flex items-center">
            {rightContent}
          </div>
        )}

        {/* Chevron for clickable cards */}
        {onClick && !rightContent && (
          <svg className="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </Wrapper>
  );
};

// Quick status card variant
MobileCard.Status = ({ label, value, trend, trendUp, className = '' }) => (
  <div className={`bg-white rounded-lg p-4 ${className}`}>
    <p className="text-sm text-gray-500">{label}</p>
    <div className="flex items-end justify-between mt-1">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <span className={`flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default MobileCard;
