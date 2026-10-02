import React from 'react';

/**
 * Reusable TabBar component
 * @param {{
 *   tabs: Array<{ id: string, label: string, count?: number, icon?: React.ComponentType<{ size?: number }> }>,
 *   activeTab: string,
 *   onChange: (id: string) => void,
 *   className?: string
 * }} props
 */
export default function TabBar({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`tabs-bar ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? 'active' : ''}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={14} className="tab-icon" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
