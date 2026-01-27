import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as http from 'http';
import * as https from 'https';
import { AddressInfo } from 'net';

export class GalleryProxyServer {
    private app: express.Express;
    private server: http.Server | null = null;
    private targetUrl = 'https://ui-ux-pro-max-skill.nextlevelbuilder.io';
    private port: number = 0;

    constructor() {
        this.app = express();
        this.setupRoutes();
    }

    public async start(): Promise<number> {
        return new Promise((resolve, reject) => {
            // Use port 0 for random available port
            this.server = this.app.listen(0, '127.0.0.1', () => {
                const address = this.server?.address() as AddressInfo;
                this.port = address.port;
                console.log(`[GalleryProxy] Server started on port ${this.port}`);
                resolve(this.port);
            });
            this.server.on('error', (err) => reject(err));
        });
    }

    public stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('[GalleryProxy] Server stopped');
        }
    }

    public getPort(): number {
        return this.port;
    }

    private setupRoutes() {
        // 1. Intercept Root and Hash Routes to Inject Polyfill
        // We handle index.html manually to inject the script into the body
        const indexHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // Only intercept HTML requests (root or specific paths if needed)
            // But since it is SPA, we might want to intercept everything that accepts html
            // For now, let's just do root.
            
            // Actually, using the http-proxy-middleware with response interception is harder.
            // We'll just fetch the index.html manually for the root request.
            
            this.fetchAndInject(this.targetUrl + req.url).then(html => {
                res.send(html);
            }).catch(err => {
                console.error("Proxy fetch error:", err);
                next(); // Fallback to proxy
            });
        };

        this.app.get('/', indexHandler);
        this.app.get('/index.html', indexHandler);

        // 2. Proxy everything else (Assets, JS, CSS)
        this.app.use('/', (createProxyMiddleware as any)({
            target: this.targetUrl,
            changeOrigin: true,
            selfHandleResponse: false, 
            onProxyRes: (proxyRes: any, req: any, res: any) => {
                // Strip Blocking Headers
                if (proxyRes.headers) {
                    delete proxyRes.headers['x-frame-options'];
                    delete proxyRes.headers['content-security-policy'];
                    // Add CORS
                    proxyRes.headers['access-control-allow-origin'] = '*';
                }
            },
            onError: (err: any, req: any, res: any) => {
                console.error('[GalleryProxy] Proxy Error:', err);
                if (res.statusCode) {
                    res.statusCode = 500;
                    res.end('Proxy Error');
                } else {
                    res.status(500).send('Proxy Error');
                }
            }
        }));
    }

    private fetchAndInject(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            https.get(url, (res: http.IncomingMessage) => {
                const chunks: any[] = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                   const buffer = Buffer.concat(chunks);
                   let html = buffer.toString();
                   
                   // Inject Polyfill for Iframe -> Parent communication
                   const polyfill = `
                   <script>
                        // Polyfill Clipboard
                        if (!navigator.clipboard) navigator.clipboard = {};
                        
                        navigator.clipboard.writeText = function(text) {
                            console.log('Proxy: Intercepted copy', text);
                            // Send to parent (VS Code Webview)
                            window.parent.postMessage({ command: 'copy', text: text }, '*');
                            return Promise.resolve();
                        };
                        
                        // Error logging
                        window.onerror = function(msg) {
                            window.parent.postMessage({ command: 'error', text: msg }, '*');
                        };
                   </script>
                   `;
                   // Insert before closing body or head
                   html = html.replace('</body>', polyfill + '</body>');
                   resolve(html);
                });
            }).on('error', reject);
        });
    }
}
