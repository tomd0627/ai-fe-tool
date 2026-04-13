import react from '@vitejs/plugin-react';
import { defineConfig, isRunnableDevEnvironment, loadEnv, type Connect, type Plugin } from 'vite';

function netlifyFunctionsDevPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      // Vite 8 does not inject non-VITE_ prefixed .env vars into process.env.
      // Inject them here so the function handler can read ANTHROPIC_API_KEY etc.
      const fileEnv = loadEnv(server.config.mode, server.config.root, '');
      for (const [key, value] of Object.entries(fileEnv)) {
        if (!(key in process.env)) process.env[key] = value;
      }

      // Lazily load the handler on the first request using the Vite 8 runner API.
      // ssrLoadModule is deprecated in Vite 8; server.environments.ssr.runner.import is the replacement.
      let handlerPromise: Promise<typeof import('./netlify/functions/explain-css.js')['handler'] | null> | null = null;

      function getHandler() {
        if (!handlerPromise) {
          const ssrEnv = server.environments.ssr;
          if (!isRunnableDevEnvironment(ssrEnv)) {
            return Promise.resolve(null);
          }
          handlerPromise = ssrEnv.runner
            .import('./netlify/functions/explain-css.ts')
            .then((mod: typeof import('./netlify/functions/explain-css.js')) => mod.handler)
            .catch((err: unknown) => {
              console.error('[netlify-dev] Failed to load explain-css handler:', err);
              handlerPromise = null;
              return null;
            });
        }
        return handlerPromise;
      }

      server.middlewares.use(
        '/.netlify/functions/explain-css',
        (req: Connect.IncomingMessage, res, next) => {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            });
            res.end();
            return;
          }

          if (req.method !== 'POST') {
            next();
            return;
          }

          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');

            getHandler()
              .then(async (handler) => {
                if (!handler) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ ok: false, error: 'Handler failed to load', code: 'API_ERROR' }));
                  return;
                }
                const result = await handler(
                  {
                    httpMethod: req.method ?? 'POST',
                    headers: req.headers as Record<string, string>,
                    body,
                    isBase64Encoded: false,
                    rawUrl: req.url ?? '',
                    rawQuery: '',
                    path: req.url ?? '',
                    queryStringParameters: null,
                    multiValueQueryStringParameters: null,
                    multiValueHeaders: {},
                  },
                  {} as never,
                  () => {},
                );
                if (result) {
                  res.writeHead(result.statusCode, {
                    'Content-Type': 'application/json',
                    ...result.headers,
                  });
                  res.end(result.body);
                } else {
                  next();
                }
              })
              .catch((err: unknown) => {
                console.error('[netlify-dev]', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Dev proxy error', code: 'API_ERROR' }));
              });
          });
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  envPrefix: 'VITE_',
});
