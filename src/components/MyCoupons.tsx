import { useState, useEffect } from 'react';
import { mcpClient } from '../services/mcpClient';
import './MyCoupons.css';
import './NoTokenPrompt.css';

interface MyCouponsProps {
  token: string | null;
}

export default function MyCoupons({ token }: MyCouponsProps) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMyCoupons = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await mcpClient.getMyCoupons();
      if (result) {
        let content = '';
        if (result.content && Array.isArray(result.content)) {
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
          setCoupons(parseMyCoupons(content));
        } else {
          setCoupons([]);
        }
      } else {
        setCoupons([]);
      }
    } catch (err: any) {
      setError(err.message || '获取已领取的优惠券失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyCoupons();
    }
  }, [token]);

  const formatValidity = (validity: string): string => {
    if (!validity) return validity;
    
    // 匹配格式：2026-01-19 10:45-2026-01-23 23:59 周一、二、三、四、五 10:45-23:59
    const dateRangeMatch = validity.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})-(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    const weekdaysMatch = validity.match(/(周[一二三四五六日、]+)/);
    const timeMatch = validity.match(/(\d{2}:\d{2}-\d{2}:\d{2})/);
    
    if (dateRangeMatch) {
      const [, startDateStr, , endDateStr] = dateRangeMatch;
      
      // 解析日期
      const start = new Date(startDateStr + 'T00:00:00');
      const end = new Date(endDateStr + 'T00:00:00');
      
      // 格式化日期：1月19日
      const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      };
      
      let result = '';
      
      // 如果同一个月，显示：1月19日-23日
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        result = `${formatDate(start)}-${end.getDate()}日`;
      } else {
        result = `${formatDate(start)} - ${formatDate(end)}`;
      }
      
      // 添加时间（优先使用后面的时间范围，因为它更准确）
      if (timeMatch && timeMatch[1]) {
        result += ` ${timeMatch[1]}`;
      }
      
      // 添加星期
      if (weekdaysMatch) {
        const weekdaysStr = weekdaysMatch[1];
        const weekdays = weekdaysStr.replace(/周/g, '').split('、').filter(w => w);
        if (weekdays.length > 1) {
          result += `（周${weekdays[0]}至周${weekdays[weekdays.length - 1]}）`;
        } else if (weekdays.length === 1) {
          result += `（周${weekdays[0]}）`;
        }
      }
      
      return result;
    }
    
    // 如果格式不匹配，返回原文本
    return validity;
  };

  const parseMyCoupons = (content: string): any[] => {
    const coupons: any[] = [];
    const lines = content.split('\n');
    
    let currentCoupon: any = null;
    for (const line of lines) {
      // 匹配标题（## 开头的）
      if (line.startsWith('## ') && !line.includes('优惠券列表')) {
        if (currentCoupon) coupons.push(currentCoupon);
        currentCoupon = {
          title: line.replace('## ', '').trim(),
          price: '',
          validity: '',
          tags: [],
          image: '',
        };
      } else if (line.includes('**优惠**:') && currentCoupon) {
        const match = line.match(/\*\*优惠\*\*[：:]\s*([^\(]+)/);
        if (match) currentCoupon.price = match[1].trim();
      } else if (line.includes('**有效期**:') && currentCoupon) {
        const match = line.match(/\*\*有效期\*\*[：:]\s*(.+)/);
        if (match) {
          const rawValidity = match[1].trim();
          currentCoupon.validity = formatValidity(rawValidity);
        }
      } else if (line.includes('**标签**:') && currentCoupon) {
        const match = line.match(/\*\*标签\*\*[：:]\s*(.+)/);
        if (match) {
          currentCoupon.tags = match[1].split('、').map((t: string) => t.trim());
        }
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

  if (!token) {
    return (
      <div className="no-token-prompt">
        <h2>需要设置 Token 才能使用</h2>
        <p>请先设置 MCP Token 以查看已领取的优惠券</p>
        <p className="hint">点击顶部右侧的【设置 Token】按钮进行设置</p>
      </div>
    );
  }

  return (
    <div className="coupons-container">
      {error && <div className="error-message">{error}</div>}

      {loading && coupons.length === 0 ? (
        <div className="loading">加载中...</div>
      ) : coupons.length === 0 ? (
        <div className="empty-state">您还没有优惠券</div>
      ) : (
        <div className="coupons-grid">
          {coupons.map((coupon, index) => (
            <div key={index} className="coupon-card">
              {coupon.image && (
                <img src={coupon.image} alt={coupon.title} className="coupon-image" />
              )}
              <div className="coupon-info">
                <h3 className="coupon-title">{coupon.title}</h3>
                {coupon.price && (
                  <div className="coupon-price">{coupon.price}</div>
                )}
                {coupon.validity && (
                  <div className="coupon-validity">{coupon.validity}</div>
                )}
                {coupon.tags && coupon.tags.length > 0 && (
                  <div className="coupon-tags">
                    {coupon.tags.map((tag: string, i: number) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
