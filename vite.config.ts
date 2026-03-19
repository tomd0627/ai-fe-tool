import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';

function netlifyFunctionsDevPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(
        '/.netlify/functions/explain-css',
        async (req: Connect.IncomingMessage, res, next) => {
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

          try {
            const { handler } = await import('./netlify/functions/explain-css.js');
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', async () => {
              const body = Buffer.concat(chunks).toString('utf-8');
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
            });
          } catch (err) {
            console.error('[netlify-dev]', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Dev proxy error', code: 'API_ERROR' }));
          }
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  envPrefix: 'VITE_',
});
