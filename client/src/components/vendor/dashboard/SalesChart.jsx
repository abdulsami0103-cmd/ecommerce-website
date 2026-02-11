import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `Rs ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `Rs ${(value / 1000).toFixed(1)}K`;
  }
  return `Rs ${value}`;
};

const formatDateSafe = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    if (isValid(date)) {
      return format(date, 'MMM dd, yyyy');
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    if (isValid(date)) {
      return format(date, 'MMM dd');
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {formatDateSafe(label)}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{' '}
            {entry.name === 'Revenue'
              ? `Rs ${entry.value?.toLocaleString() || 0}`
              : entry.value || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DateRangeSelector = ({ value, onChange }) => {
  const options = [
    { value: '7d', label: '7D', labelFull: '7 Days' },
    { value: '30d', label: '30D', labelFull: '30 Days' },
    { value: '90d', label: '90D', labelFull: '90 Days' },
  ];

  return (
    <div className="flex gap-1 sm:gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-1.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm rounded-md sm:rounded-lg transition-colors ${
            value === option.value
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="sm:hidden">{option.label}</span>
          <span className="hidden sm:inline">{option.labelFull}</span>
        </button>
      ))}
    </div>
  );
};

const ChartTypeSelector = ({ value, onChange }) => {
  return (
    <div className="flex gap-1 sm:gap-2">
      <button
        onClick={() => onChange('line')}
        className={`p-1 sm:p-2 rounded-md sm:rounded-lg transition-colors ${
          value === 'line' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'
        }`}
        title="Line Chart"
      >
        <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"
          />
        </svg>
      </button>
      <button
        onClick={() => onChange('bar')}
        className={`p-1 sm:p-2 rounded-md sm:rounded-lg transition-colors ${
          value === 'bar' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'
        }`}
        title="Bar Chart"
      >
        <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
    </div>
  );
};

const SalesChart = ({ data, totals, loading, dateRange, onDateRangeChange, onExport }) => {
  const [chartType, setChartType] = useState('line');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const chartData = data?.map((d) => ({
    ...d,
    dateLabel: formatDateShort(d.date),
  })) || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-emerald-600">Sales Overview</h3>
          <p className="text-[10px] sm:text-sm text-gray-500">Revenue and orders over time</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4">
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
          <ChartTypeSelector value={chartType} onChange={setChartType} />
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Revenue</p>
          <p className="text-xs sm:text-xl font-bold text-emerald-600 truncate">
            Rs {formatCurrency(totals?.revenue || 0).replace('Rs ', '')}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Orders</p>
          <p className="text-xs sm:text-xl font-bold text-blue-600">{totals?.orders || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Avg Value</p>
          <p className="text-xs sm:text-xl font-bold text-purple-600 truncate">
            Rs {formatCurrency(totals?.averageOrderValue || 0).replace('Rs ', '')}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No sales data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesChart;
