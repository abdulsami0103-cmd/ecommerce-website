import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const OrderOverviewChart = ({ data = [], title = "Order Overview" }) => {
  const [period, setPeriod] = useState('Monthly');

  // Default demo data matching Biko design
  const chartData = data.length > 0 ? data : [
    { name: 'Jul 18', orders: 320 },
    { name: 'Jul 19', orders: 450 },
    { name: 'Jul 20', orders: 380 },
    { name: 'Jul 21', orders: 448 },
    { name: 'Jul 22', orders: 520 },
    { name: 'Jul 23', orders: 380 },
  ];

  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-teal-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{payload[0].value}</p>
          <p className="text-xs opacity-80">{label}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <MoreIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Period Dropdown */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-600 focus:outline-none"
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Total Number */}
          <p className="text-2xl font-bold text-gray-900">1,790</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="orderGradientTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              domain={[100, 1200]}
              ticks={[100, 200, 400, 600, 800, 1000, 1200]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#orderGradientTeal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrderOverviewChart;
