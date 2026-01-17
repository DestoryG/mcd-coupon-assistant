// Netlify Function 用于代理 MCP Server 请求，解决 CORS 问题
exports.handler = async (event, context) => {
  // 处理 CORS preflight 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        jsonrpc: '2.0',
        id: null,
        error: { code: -32601, message: 'Method Not Allowed' }
      }),
    };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    // 转发请求到 MCP Server
    const response = await fetch('https://mcp.mcd.cn/mcp-servers/mcd-mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization || event.headers.Authorization || '',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: 'Proxy Error: ' + (error.message || 'Unknown error')
        }
      }),
    };
  }
};
