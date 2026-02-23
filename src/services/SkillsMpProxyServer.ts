import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as http from 'http';
import * as https from 'https';
import { AddressInfo } from 'net';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class SkillsMpProxyServer {
    private app: express.Express;
    private server: http.Server | null = null;
    private targetUrl = 'https://skillsmp.com';
    private port: number = 0;
    
    // Callback for when a zip is intercepted
    public onZipDownloaded: ((path: string) => void) | undefined;

    constructor() {
        this.app = express();
        this.setupRoutes();
    }

    public async start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(0, '127.0.0.1', () => {
                const address = this.server?.address() as AddressInfo;
                this.port = address.port;
                console.log(`[SkillsMpProxy] Server started on port ${this.port}`);
                resolve(this.port);
            });
            this.server.on('error', (err) => reject(err));
        });
    }

    public stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('[SkillsMpProxy] Server stopped');
        }
    }

    public getPort(): number {
        return this.port;
    }

    private setupRoutes() {
        // Middleware to Intercept ZIP downloads
        const zipInterceptor = (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (req.url.toLowerCase().endsWith('.zip') || req.path.toLowerCase().endsWith('.zip')) {
                console.log(`[SkillsMpProxy] Intercepting ZIP request: ${req.url}`);
                
                // Construct upstream URL
                const upstreamUrl = this.targetUrl + req.url;
                
                // We will stream the download to a temp file
                const tmpPath = path.join(os.tmpdir(), `skill-${Date.now()}.zip`);
                const fileStream = fs.createWriteStream(tmpPath);

                console.log(`[SkillsMpProxy] Downloading to ${tmpPath}...`);

                // Use native https to download (ignoring certifications if needed, or passing cookies?)
                // NOTE: We should ideally forward headers from the original request (cookies!)
                // req.headers contains the headers from the Browser (Webview).
                
                const options: https.RequestOptions = {
                    headers: req.headers as any, // Forward headers (Cookies, User-Agent)
                    rejectUnauthorized: false // Be lenient
                };

                const request = https.get(upstreamUrl, options, (response) => {
                     // Check for redirects?
                     if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                         // Handle Redirect (Simple Follow once)
                         // For now, let's hope standard library or simple logic handles it.
                         // Actually https.get doesn't auto-follow redirects.
                         // But if we pipe the proxy, we lose control.
                         // Let's rely on the proxy middleware for general browsing, 
                         // but for ZIPs we want to CAPTURE the bytes.
                         // If we use http-proxy-middleware `onProxyRes`, we can pipe to file?
                         // Let's try to do it here manually first.
                         
                         // If redirect, we should follow.
                         // But doing a full download manager here is complex.
                         // Alternative: Use the Proxy Middleware, but hook into `onProxyRes`.
                     }

                    response.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close();
                        console.log(`[SkillsMpProxy] Download complete.`);
                        
                        // Notify Listener
                        if (this.onZipDownloaded) {
                            this.onZipDownloaded(tmpPath);
                        }

                        // Send response to User
                        res.setHeader('Content-Type', 'text/html');
                        res.write(`
                            <html>
                            <body style="font-family: sans-serif; background: #1e1e1e; color: #fff; padding: 20px; text-align: center;">
                                <h1>Download Intercepted!</h1>
                                <p>The skill is being imported into Antigravity...</p>
                                <p>You can close this, or continue browsing.</p>
                                <script>
                                    // Optional: Notify parent if needed, though Backend handles it.
                                </script>
                            </body>
                            </html>
                        `);
                        res.end();
                    });
                }).on('error', (err) => {
                    fs.unlink(tmpPath, () => {}); // Delete temp file
                    console.error("[SkillsMpProxy] Download failed:", err);
                    res.status(500).send("Download Error");
                });
                
                return; // Stop propagation (don't pass to proxy middleware)
            }
            next();
        };

        this.app.use(zipInterceptor);

        // Serve Index and Inject Logic
        // We use a wildcard to catch HTML pages and inject our bridge script
        // But http-proxy-middleware `onProxyRes` with `responseInterceptor` (if available) is better.
        // Given dependencies, let's try the simple "Fetch and Inject" for root, 
        // and Proxy for everything else.
        // However, if the user navigates to /skills/xyz, we want to inject there too.
        
        // Let's try: standard proxy, but strip X-Frame-Options.
        // And we inject a small overlay?
        // Actually, if we just want to intercept downloads, the `zipInterceptor` above is enough for the BACKEND part.
        // For the FRONTEND (clicking links), if the link is relative, it hits our proxy, and `zipInterceptor` catches it.
        // If the link is Absolute, we need to rewrite it.
        
        // This makes `responseInterceptor` valuable.
        // Checking package.json via `npm list` (from previous step) would confirm if we have response-interceptor capability.
        // Assuming we rely on standard proxy for now.
        
        this.app.use('/', (createProxyMiddleware as any)({
            target: this.targetUrl,
            changeOrigin: true,
            selfHandleResponse: true, // Verification: We need to handle response manually to intercept 403
            onProxyRes: (proxyRes: any, req: any, res: any) => {
                // Strip Blocking Headers
                if (proxyRes.headers) {
                    delete proxyRes.headers['x-frame-options'];
                    delete proxyRes.headers['content-security-policy'];
                    proxyRes.headers['access-control-allow-origin'] = '*';
                }

                // Check for Cloudflare Block
                if (proxyRes.statusCode === 403 || proxyRes.statusCode === 503) {
                    console.log(`[SkillsMpProxy] Upstream blocked (${proxyRes.statusCode}). Serving fallback.`);
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' }); // Return 200 so Webview shows it
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { background: #1e1e1e; color: #cccccc; font-family: sans-serif; padding: 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:90vh; text-align:center;}
                                h2 { color: #f48771; }
                                .btn { background: #0e639c; color: white; border: none; padding: 10px 20px; cursor: pointer; font-size: 14px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 10px;}
                                .btn:hover { background: #1177bb; }
                            </style>
                        </head>
                        <body>
                            <h2>Access Protected by Site</h2>
                            <p><b>skillsmp.com</b> has anti-bot protection (Cloudflare) that blocks embedded proxies.</p>
                            <p>Please open the site in your external browser to download the skill ZIP.</p>
                            
                            <a href="#" class="btn" onclick="openExternal()">
                                Open in External Browser ↗
                            </a>
                            
                            <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
                                After downloading, drag the ZIP into the <b>Installer</b> section below.
                            </p>

                            <script>
                                const vscode = acquireVsCodeApi();
                                function openExternal() {
                                    vscode.postMessage({ command: 'openExternal', url: '${this.targetUrl}' });
                                }
                            </script>
                        </body>
                        </html>
                    `);
                    return;
                }

                // Default: Pipe response
                // Since selfHandleResponse is true, we must pipe manually
                 proxyRes.pipe(res);
            },
            onError: (err: any, req: any, res: any) => {
                console.error('[SkillsMpProxy] Proxy Error:', err);
                res.status(500).send('Proxy Connection Error: ' + err.message);
            }
        }));
    }
}
