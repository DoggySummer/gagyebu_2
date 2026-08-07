import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getRequestListener } from '@hono/node-server'

interface HonoModule {
  default: { fetch: (request: Request) => Response | Promise<Response> }
}

/**
 * 개발 서버에서도 /api 를 Hono가 처리하게 한다.
 *
 * 이게 없으면 npm run dev 로는 API가 없어 vercel dev 가 강제된다.
 * ssrLoadModule 로 매 요청마다 불러오므로 서버 코드도 저장 즉시 반영된다.
 */
function honoDevServer(): PluginOption {
  return {
    name: 'hono-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          next()
          return
        }

        server
          .ssrLoadModule('/server/app.ts')
          .then((module) => getRequestListener((module as HonoModule).default.fetch)(req, res))
          .catch(next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 서버 코드는 process.env 를 읽는다. .env.local 값을 넣어줘야 개발 서버에서도 동작한다.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), tailwindcss(), honoDevServer()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
  }
})
