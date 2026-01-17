import axios, { AxiosInstance } from 'axios';

// 使用代理路径避免 CORS 问题
// 开发环境使用 Vite 代理，生产环境使用 Netlify 代理
const MCP_SERVER_URL = '/api/mcp';

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: MCP_SERVER_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setToken(token: string) {
    this.token = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  private async callTool(toolName: string, arguments_: any = {}): Promise<any> {
    if (!this.token) {
      throw new Error('请先设置 MCP Token');
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_,
      },
    };

    try {
      // 使用代理路径（开发环境通过 Vite 代理，生产环境通过 Netlify Function）
      const response = await this.axiosInstance.post<MCPResponse>('', request, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (response.data.error) {
        throw new Error(response.data.error.message || '请求失败');
      }

      // 处理 MCP 响应格式
      // MCP 响应可能包含 result 字段，其中包含 content 数组
      if (response.data.result) {
        // 如果 result 是对象且包含 content，直接返回
        if (typeof response.data.result === 'object' && response.data.result.content) {
          return response.data.result;
        }
        // 如果 result 本身就是内容，返回包装后的格式
        return {
          content: Array.isArray(response.data.result) 
            ? response.data.result 
            : [{ type: 'text', text: JSON.stringify(response.data.result) }]
        };
      }

      // 如果没有 result，尝试直接使用 data
      return response.data;
    } catch (error: any) {
      // 处理网络错误（CORS、连接失败等）
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('网络连接失败：可能是 CORS 跨域问题。MCP Server 可能需要通过代理服务器访问，或者需要在服务器端调用。');
      }
      
      if (error.response) {
        // 服务器返回了响应
        if (error.response.status === 429) {
          throw new Error('请求频率过高，请稍后再试（每分钟最多 600 次请求）');
        }
        if (error.response.status === 401) {
          throw new Error('Token 无效或已过期，请重新设置');
        }
        if (error.response.status === 403) {
          throw new Error('Token 权限不足');
        }
        if (error.response.status === 404) {
          throw new Error('API 端点不存在，请检查 MCP Server 地址是否正确');
        }
        if (error.response.status === 500) {
          throw new Error('服务器内部错误，请稍后重试');
        }
        throw new Error(`请求失败 (${error.response.status}): ${error.response.data?.message || error.response.statusText || '未知错误'}`);
      }
      
      // 其他错误
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('网络请求失败，请检查网络连接和 MCP Server 地址');
    }
  }

  // 麦麦省券列表查询
  async getAvailableCoupons(): Promise<any> {
    return this.callTool('available-coupons', {});
  }

  // 一键领券
  async autoBindCoupons(): Promise<any> {
    return this.callTool('auto-bind-coupons', {});
  }

  // 我的优惠券查询
  async getMyCoupons(): Promise<any> {
    return this.callTool('my-coupons', {});
  }

  // 当前时间信息查询
  async getNowTimeInfo(): Promise<any> {
    return this.callTool('now-time-info', {});
  }
}

export const mcpClient = new MCPClient();
