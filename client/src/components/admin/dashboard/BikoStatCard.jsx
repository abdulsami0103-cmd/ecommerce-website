const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const BikoStatCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-500',
}) => {
  const isPositive = change >= 0;

  const formatValue = (val) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm">
      {/* Top Row: Value and Icon */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatValue(value)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{title}</p>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${iconBgColor}`}>
          {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />}
        </div>
      </div>

      {/* Bottom Row: Percentage and Menu */}
      <div className="flex items-center justify-between mt-3 sm:mt-4">
        <span className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded ${
          isPositive
            ? 'text-emerald-600 bg-emerald-50'
            : 'text-red-600 bg-red-50'
        }`}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <MoreIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default BikoStatCard;
