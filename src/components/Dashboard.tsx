import { useState } from 'react';
import AvailableCoupons from './AvailableCoupons';
import MyCoupons from './MyCoupons';
import TokenSetup from './TokenSetup';
import './Dashboard.css';

interface DashboardProps {
  token: string | null;
  onTokenSet: (token: string) => void;
  onTokenClear: () => void;
}

type TabType = 'available' | 'my-coupons';

export default function Dashboard({ token, onTokenSet, onTokenClear }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('available');

  const tabs = [
    { id: 'available' as TabType, label: '可领取' },
    { id: 'my-coupons' as TabType, label: '已领取' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="site-title">麦当劳优惠券领取助手</h1>
        {token && (
          <div className="header-actions">
            <button onClick={onTokenClear} className="clear-token-btn">
              清除 Token
            </button>
          </div>
        )}
      </div>

      {!token ? (
        <TokenSetup onTokenSet={onTokenSet} />
      ) : (
        <>
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'available' && <AvailableCoupons token={token} />}
            {activeTab === 'my-coupons' && <MyCoupons token={token} />}
          </div>
        </>
      )}
      
      <footer className="app-footer">
        <p>
          © 2020-2025 McDonald's. All Rights Reserved | 
          Developed by <a href="https://www.ruiying.li/" target="_blank" rel="noopener noreferrer" className="footer-link">Ruiying Li</a>
        </p>
      </footer>
    </div>
  );
}
