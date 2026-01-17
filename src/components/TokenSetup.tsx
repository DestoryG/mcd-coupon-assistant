import { useState } from 'react';
import { mcpClient } from '../services/mcpClient';
import './TokenSetup.css';

interface TokenSetupProps {
  onTokenSet: (token: string) => void;
}

export default function TokenSetup({ onTokenSet }: TokenSetupProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('请输入 MCP Token');
      return;
    }

    setIsSubmitting(true);
    try {
      // 简单验证 token 格式
      if (token.length < 10) {
        throw new Error('Token 格式不正确');
      }
      
      // 测试 token 是否有效
      mcpClient.setToken(token);
      await mcpClient.getNowTimeInfo();
      
      onTokenSet(token);
    } catch (err: any) {
      setError(err.message || 'Token 验证失败，请检查是否正确');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="token-setup">
      <div className="token-setup-card">
        <h2>设置 MCP Token</h2>
        <p className="description">
          请先申请并输入您的 MCP Token。如果您还没有 Token，请访问{' '}
          <a 
            href="https://open.mcd.cn/mcp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link"
          >
            https://open.mcd.cn/mcp
          </a>{' '}
          进行申请。
        </p>

        <form onSubmit={handleSubmit} className="token-form">
          <div className="form-group">
            <label htmlFor="token">MCP Token</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入您的 MCP Token"
              className="token-input"
              disabled={isSubmitting}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '验证中...' : '确认设置'}
          </button>
        </form>

        <div className="help-section">
          <h3>如何申请 MCP Token？</h3>
          <ol>
            <li>访问 <a href="https://open.mcd.cn/mcp" target="_blank" rel="noopener noreferrer" className="link">https://open.mcd.cn/mcp</a></li>
            <li>点击右上角【登录】按钮，使用手机号验证登录</li>
            <li>登录后点击【控制台】</li>
            <li>点击【激活】按钮申请 MCP Token</li>
            <li>同意服务协议后即可获得 Token</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
