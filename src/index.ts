import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { connectDB } from '@/config/database.js'
import auth from '@/routes/auth.js'
import "@/lib/hashPassword.js"
import { swaggerUI } from '@hono/swagger-ui';
import swagger from '@/docs/route.js';

async function init() {
  try {
    const app = new Hono()
    const PORT = 10_000

    await connectDB()
    
    app.use(poweredBy())
    app.use(logger())

    app.get('/ui', swaggerUI({ url: '/doc/openapi.json' }));
    app.get('/doc/openapi.json', (c) => {
      return c.json(swagger.getOpenAPIDocument({
        openapi: '3.1.0',
        info: {
          title: 'Auth API',
          version: '1.0.0',
          description: 'API for user authentication',
        },
        servers: [
          {
            url: '{protocol}://{baseurl}/api',
            description: 'Identify Server Test API',
            variables: {
              protocol: {
                default: 'http',
                enum: ['http', 'https'],
              },
              baseurl: {
                default: 'localhost:10000',
                enum: ['localhost:10000'],
              },
            }
          }
        ],
      }));
    });

    app.use('/api/*', cors())
    app.route('/api', auth)
    
    serve({
      fetch: app.fetch,
      port: PORT
    })
    
    console.log(`Server is running on http://localhost:${PORT}`)
  } catch (error) {
    console.error('init err: ', error)
  }
}

init()
