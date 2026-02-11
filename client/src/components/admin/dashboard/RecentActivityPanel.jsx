const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const RecentActivityPanel = ({ activities = [] }) => {
  // Default demo data matching Biko design
  const activityData = activities.length > 0 ? activities : [
    {
      id: 1,
      title: 'Your account is logged in',
      description: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.',
      time: '45 min ago',
      user: 'Wade Warren',
      avatar: null,
      dotColor: 'bg-emerald-500'
    },
    {
      id: 2,
      title: 'Current language changed',
      description: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.',
      time: '01 hour ago',
      user: 'Ronald Richards',
      avatar: null,
      dotColor: 'bg-amber-500'
    },
    {
      id: 3,
      title: 'Asked about this project',
      description: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.',
      time: '03 hour ago',
      user: 'Kristin Watson',
      avatar: null,
      dotColor: 'bg-emerald-500'
    },
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
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <MoreIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-6">
        {activityData.map((activity, index) => (
          <div key={activity.id} className="relative">
            {/* Colored Dot */}
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${activity.dotColor || 'bg-emerald-500'}`} />

              <div className="flex-1 min-w-0">
                {/* Title and Time */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</p>

                {/* User */}
                <div className="flex items-center gap-2 mt-3">
                  {activity.avatar ? (
                    <img
                      src={activity.avatar}
                      alt={activity.user}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                      <span className="text-white text-xs font-medium">
                        {getInitials(activity.user)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{activity.user}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityPanel;
