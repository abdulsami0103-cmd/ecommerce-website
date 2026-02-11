import { useState } from 'react';

/**
 * Tabs Component - Reusable tab navigation
 *
 * Usage:
 * <Tabs
 *   tabs={[
 *     { id: 'general', label: 'General', icon: SettingsIcon },
 *     { id: 'media', label: 'Media' },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 */
const Tabs = ({ tabs, activeTab, onChange, variant = 'underline', className = '' }) => {
  const baseStyles = {
    underline: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-3 text-sm font-medium transition-colors',
      active: 'text-sky-600 border-b-2 border-sky-600 -mb-px',
      inactive: 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent -mb-px',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'px-4 py-2 text-sm font-medium rounded-md transition-colors',
      active: 'bg-white text-gray-900 shadow',
      inactive: 'text-gray-600 hover:text-gray-900',
    },
    buttons: {
      container: 'flex gap-2',
      tab: 'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      active: 'bg-sky-600 text-white',
      inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
  };

  const styles = baseStyles[variant] || baseStyles.underline;

  return (
    <div className={`flex ${styles.container} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            disabled={tab.disabled}
            className={`
              ${styles.tab}
              ${isActive ? styles.active : styles.inactive}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center gap-2
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge && (
              <span className={`
                ml-1 px-2 py-0.5 text-xs rounded-full
                ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-gray-200 text-gray-600'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * TabPanel Component - Content container for each tab
 */
const TabPanel = ({ children, value, activeTab, className = '' }) => {
  if (value !== activeTab) return null;

  return (
    <div className={`py-4 ${className}`} role="tabpanel">
      {children}
    </div>
  );
};

/**
 * TabsContainer Component - Complete tabs solution
 */
const TabsContainer = ({ tabs, defaultTab, variant = 'underline', className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
      />
      {tabs.map((tab) => (
        <TabPanel key={tab.id} value={tab.id} activeTab={activeTab}>
          {tab.content}
        </TabPanel>
      ))}
    </div>
  );
};

export { Tabs, TabPanel, TabsContainer };
export default Tabs;
