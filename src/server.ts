import 'dotenv/config'

import fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { memoriesRoutes } from './routes/memories'
import { authRoutes } from './routes/auth'
import { uploadRoutes } from './routes/upload'
import cors from '@fastify/cors'
import fs from 'fs'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.register(multipart)

app.register(jwt, {
  secret: 'spacetime',
})

app.register(require('@fastify/http-proxy'), {
  upstream: 'https://console.cloud.google.com',
  prefix: '/storage',
  http2: false, // optional
})

app.register(uploadRoutes)
app.register(authRoutes)
app.register(memoriesRoutes)

app
  .listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log('🔥HTTP server running')
  })
