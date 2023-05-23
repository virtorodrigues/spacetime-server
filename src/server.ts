import 'dotenv/config'

import fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { memoriesRoutes } from './routes/memories'
import { authRoutes } from './routes/auth'
import { uploadRoutes } from './routes/upload'
import cors from '@fastify/cors'
import fs from 'fs'

// const app = fastify({
//   http2: true,
//   https: {
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem'),
//   },
// })
const app = fastify()

app.register(multipart)

app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'spacetime',
})

app.register(require('fastify-https-redirect'))

app.register(require('@fastify/http-proxy'), {
  upstream: 'https://console.cloud.google.com/storage/browser',
  prefix: '/spacetime-bucket',
  http2: false, // optional
})

app.register(uploadRoutes)
app.register(authRoutes)
app.register(memoriesRoutes)

app
  .listen({
    host: process.env.HOST ? String(process.env.HOST) : '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log('🔥HTTP server running')
  })
