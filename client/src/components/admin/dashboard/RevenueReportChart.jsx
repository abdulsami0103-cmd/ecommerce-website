import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const RevenueReportChart = ({ data = [], title = "Revenue Report" }) => {
  const [period, setPeriod] = useState('6 Month');

  // Default demo data if none provided
  const chartData = data.length > 0 ? data : [
    { name: 'Jan', earnings: 320000, invested: 180000, expenses: 220000 },
    { name: 'Feb', earnings: 380000, invested: 320000, expenses: 280000 },
    { name: 'Mar', earnings: 605800, invested: 420000, expenses: 350000 },
    { name: 'Apr', earnings: 480000, invested: 380000, expenses: 320000 },
    { name: 'May', earnings: 520000, invested: 450000, expenses: 380000 },
    { name: 'Jun', earnings: 380000, invested: 280000, expenses: 250000 },
  ];

  // Calculate totals for legend
  const totals = chartData.reduce(
    (acc, item) => ({
      earnings: acc.earnings + item.earnings,
      invested: acc.invested + item.invested,
      expenses: acc.expenses + item.expenses,
    }),
    { earnings: 0, invested: 0, expenses: 0 }
  );

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}k`;
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-violet-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{formatValue(payload[0].value)}</p>
          <p className="text-xs opacity-80">{payload[0].name}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="flex items-center gap-6">
          {/* Legend with values */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-violet-500" />
              <span className="text-sm text-gray-600">Earnings</span>
              <span className="text-sm font-semibold text-gray-900">{formatValue(totals.earnings)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-sm text-gray-600">Invested</span>
              <span className="text-sm font-semibold text-gray-900">{formatValue(totals.invested)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-400" />
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="text-sm font-semibold text-gray-900">{formatValue(totals.expenses)}</span>
            </div>
          </div>

          {/* Period Dropdown */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>6 Month</option>
              <option>3 Month</option>
              <option>1 Year</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={true} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatValue(value)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="earnings"
              name="Earnings"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="invested"
              name="Invested"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#fb7185"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueReportChart;
