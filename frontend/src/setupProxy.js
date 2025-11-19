const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/auth': '/auth' // Убедимся, что путь сохраняется
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`[Proxy] Request: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response: ${req.method} ${req.url} -> Status ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        console.error(`[Proxy] Error: ${req.method} ${req.url} -> ${err.message}`);
      }
    })
  );
  app.use(
    '/projects',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/projects': '/projects'
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`[Proxy] Request: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response: ${req.method} ${req.url} -> Status ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        console.error(`[Proxy] Error: ${req.method} ${req.url} -> ${err.message}`);
      }
    })
  );
};