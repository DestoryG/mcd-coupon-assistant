import { useState, useEffect } from 'react';
import { mcpClient } from '../services/mcpClient';
import ClaimResultModal from './ClaimResultModal';
import './AvailableCoupons.css';

interface AvailableCouponsProps {
  token: string | null;
}

export default function AvailableCoupons({ token }: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimResult, setClaimResult] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      if (!token) {
        throw new Error('请先设置 MCP Token 以查看优惠券列表');
      }
      
      const result = await mcpClient.getAvailableCoupons();
      // 解析返回的内容
      if (result) {
        let content = '';
        if (result.content && Array.isArray(result.content)) {
          // MCP 标准格式：content 是数组
          content = result.content.map((item: any) => 
            item.text || item.content || JSON.stringify(item)
          ).join('\n');
        } else if (typeof result === 'string') {
          content = result;
        } else if (result.text) {
          content = result.text;
        } else {
          content = JSON.stringify(result);
        }
        
        if (content) {
          setCoupons(parseCouponsFromContent(content));
        } else {
          setCoupons([]);
        }
      } else {
        setCoupons([]);
      }
    } catch (err: any) {
      setError(err.message || '获取优惠券列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const parseCouponsFromContent = (content: string): any[] => {
    const coupons: any[] = [];
    const lines = content.split('\n');
    
    let currentCoupon: any = null;
    for (const line of lines) {
      if (line.includes('优惠券标题：')) {
        if (currentCoupon) coupons.push(currentCoupon);
        let title = line.replace('优惠券标题：', '').trim();
        // 移除开头的列表符号和转义字符
        title = title.replace(/^-\s*/, '').replace(/\\/g, '').trim();
        currentCoupon = {
          title: title,
          status: '',
          image: '',
        };
      } else if (line.includes('状态：') && currentCoupon) {
        let status = line.replace('状态：', '').trim();
        // 移除可能的转义字符和多余字符
        status = status.replace(/\\/g, '').trim();
        // 将"已领取"转换为"已被领完"
        if (status === '已领取') {
          status = '已被领完';
        }
        currentCoupon.status = status;
      } else if (line.includes('<img') && currentCoupon) {
        const match = line.match(/src="([^"]+)"/);
        if (match) {
          currentCoupon.image = match[1];
        }
      }
    }
    if (currentCoupon) coupons.push(currentCoupon);
    
    return coupons;
  };

  const performClaim = async () => {
    setClaimLoading(true);
    setClaimError('');
    setClaimResult(null);
    setShowResultModal(false);

    try {
      await mcpClient.autoBindCoupons();
      setClaimResult({});
      setShowResultModal(true);
      // 领券成功后刷新优惠券列表
      setTimeout(() => {
        fetchCoupons();
      }, 1000);
    } catch (err: any) {
      setClaimError(err.message || '领券失败');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleClaim = async () => {
    await performClaim();
  };

  const handleSingleClaim = async (couponTitle: string) => {
    if (!confirm(`确定要领取"${couponTitle}"吗？`)) {
      return;
    }
    await performClaim();
  };

  return (
    <div className="coupons-container">
      <div className="claim-section-top">
        <button 
          onClick={handleClaim} 
          className="claim-button"
          disabled={claimLoading || !token}
        >
          {claimLoading ? '领取中...' : '一键领取所有优惠券'}
        </button>
      </div>

      {claimError && <div className="error-message">{claimError}</div>}

      <ClaimResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={claimResult}
      />

      {error && (
        <div className="error-message">
          {error}
          {!token && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              请先设置 MCP Token 以查看优惠券列表
            </p>
          )}
        </div>
      )}

      {loading && coupons.length === 0 && !error ? (
        <div className="loading">加载中...</div>
      ) : !error && coupons.length === 0 && token ? (
        <div className="empty-state">暂无可领取的优惠券</div>
      ) : !error && coupons.length > 0 ? (
        <div className="coupons-grid">
          {coupons.map((coupon, index) => (
            <div key={index} className="coupon-card">
              {coupon.image && (
                <img src={coupon.image} alt={coupon.title} className="coupon-image" />
              )}
              <div className="coupon-info">
                <h3 className="coupon-title">{coupon.title}</h3>
                <div className={`coupon-status status-${coupon.status === '未领取' ? 'available' : coupon.status === '已被领完' ? 'claimed' : 'unavailable'}`}>
                  {coupon.status}
                </div>
                {coupon.status === '未领取' && (
                  <button 
                    onClick={() => handleSingleClaim(coupon.title)}
                    className="single-claim-btn"
                    disabled={claimLoading}
                  >
                    {claimLoading ? '领取中...' : '领取'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
