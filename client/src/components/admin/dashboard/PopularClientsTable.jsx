const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const PopularClientsTable = ({ clients = [] }) => {
  // Default demo data matching Biko design
  const clientData = clients.length > 0 ? clients : [
    { id: '#4564', name: 'Theresa Webb', avatar: null, order: 300, amount: 6500 },
    { id: '#4564', name: 'Darrell Steward', avatar: null, order: 300, amount: 6500 },
    { id: '#4564', name: 'Guy Hawkins', avatar: null, order: 300, amount: 6500 },
    { id: '#4564', name: 'Cameron Williamson', avatar: null, order: 300, amount: 6500 },
    { id: '#4564', name: 'Savannah Nguyen', avatar: null, order: 300, amount: 6500 },
  ];

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Popular Clients</h3>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <MoreIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {clientData.map((client, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {client.avatar ? (
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {getInitials(client.name)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500">{client.order} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600">${client.amount}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-900 uppercase pb-4">Client</th>
              <th className="text-left text-xs font-semibold text-gray-900 uppercase pb-4">Orders</th>
              <th className="text-left text-xs font-semibold text-gray-900 uppercase pb-4">Amount</th>
              <th className="text-left text-xs font-semibold text-gray-900 uppercase pb-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {clientData.map((client, index) => (
              <tr key={index} className="border-b border-gray-50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {client.avatar ? (
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                        <span className="text-white text-xs font-medium">
                          {getInitials(client.name)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">{client.name}</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-500">{client.order}</td>
                <td className="py-3 text-sm font-medium text-emerald-600">${client.amount}</td>
                <td className="py-3">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <MoreIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PopularClientsTable;
