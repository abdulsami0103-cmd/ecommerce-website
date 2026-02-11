import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          Visits: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
        </p>
        <p className="text-sm text-gray-600">
          Share: <span className="font-semibold">{payload[0].payload.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrafficSourcesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No traffic source data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="visits"
            nameKey="source"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const CountriesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No geographic data available
      </div>
    );
  }

  // Take top 8 countries
  const chartData = data.slice(0, 8);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 12 }}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DevicesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No device data available
      </div>
    );
  }

  const deviceIcons = {
    desktop: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    mobile: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    tablet: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };

  return (
    <div className="space-y-4">
      {data.map((device, index) => (
        <div key={device.type} className="flex items-center gap-4">
          <div className="text-gray-400">
            {deviceIcons[device.type] || deviceIcons.desktop}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium capitalize text-gray-900">{device.type}</span>
              <span className="text-sm text-gray-500">{device.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${device.percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
            </div>
          </div>
          <span className="text-sm text-gray-500 w-16 text-right">
            {device.visits.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const CitiesTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No city data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-emerald-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">City</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Visits</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-100">
          {data.slice(0, 5).map((city, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-900">{city.city || 'Unknown'}</td>
              <td className="px-4 py-3 text-right text-gray-600">{city.visits.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DemographicsCharts = ({ data, loading }) => {
  const [activeTab, setActiveTab] = useState('sources');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation for Mobile */}
      <div className="flex gap-1.5 lg:hidden">
        {[
          { id: 'sources', label: 'Traffic' },
          { id: 'countries', label: 'Countries' },
          { id: 'devices', label: 'Devices' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-1.5 text-[10px] sm:text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop Grid / Mobile Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className={`bg-white rounded-2xl shadow-sm p-3 sm:p-6 ${activeTab !== 'sources' ? 'hidden lg:block' : ''}`}>
          <div className="mb-2 sm:mb-4">
            <h3 className="text-sm sm:text-lg font-semibold text-emerald-600">Traffic Sources</h3>
            <p className="text-[10px] sm:text-sm text-gray-500">Where your visitors come from</p>
          </div>
          <TrafficSourcesChart data={data?.trafficSources} />
        </div>

        {/* Countries */}
        <div className={`bg-white rounded-2xl shadow-sm p-3 sm:p-6 ${activeTab !== 'countries' ? 'hidden lg:block' : ''}`}>
          <div className="mb-2 sm:mb-4">
            <h3 className="text-sm sm:text-lg font-semibold text-emerald-600">Top Countries</h3>
            <p className="text-[10px] sm:text-sm text-gray-500">Geographic distribution of visitors</p>
          </div>
          <CountriesChart data={data?.countries} />
        </div>

        {/* Devices */}
        <div className={`bg-white rounded-2xl shadow-sm p-3 sm:p-6 ${activeTab !== 'devices' ? 'hidden lg:block' : ''}`}>
          <div className="mb-2 sm:mb-4">
            <h3 className="text-sm sm:text-lg font-semibold text-emerald-600">Device Breakdown</h3>
            <p className="text-[10px] sm:text-sm text-gray-500">How visitors access your store</p>
          </div>
          <DevicesChart data={data?.devices} />
        </div>

        {/* Top Cities */}
        <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${activeTab !== 'devices' ? 'hidden lg:block' : ''}`}>
          <div className="px-3 py-2 sm:p-6 sm:pb-4">
            <h3 className="text-sm sm:text-lg font-semibold text-emerald-600">Top Cities</h3>
            <p className="text-[10px] sm:text-sm text-gray-500">Most active locations</p>
          </div>
          <CitiesTable data={data?.cities} />
        </div>
      </div>
    </div>
  );
};

export default DemographicsCharts;
