const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/o',
        createProxyMiddleware({
            target: 'http://localhost:8000/o',
            changeOrigin: true,
        })
        );
    app.use(
        '/api',
        createProxyMiddleware({
        target: 'http://localhost:8000/api',
        changeOrigin: true,
        })
    );
};