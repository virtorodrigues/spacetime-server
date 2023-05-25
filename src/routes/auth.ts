import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import axios from 'axios'
import { prisma } from '../lib/prisma'
import { randomUUID } from 'crypto'

interface User {
  id: string
  login: string
  name: string
  avatar_url: string
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register-google', async (request) => {
    const bodySchema = z.object({
      code: z.string(),
    })

    const { code } = bodySchema.parse(request.body)

    const accessTokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      },
    )

    const { access_token } = accessTokenResponse.data

    const userResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    const userSchema = z.object({
      id: z.string(),
      login: z.string(),
      name: z.string(),
      avatar_url: z.string().url(),
    })

    const userData = userResponse.data

    const userFormatted = {
      id: userData.id,
      login: userData.email,
      name: userData.name,
      avatar_url: userData.picture,
    } as User

    const userInfo = userSchema.parse(userFormatted)

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id,
      },
    })

    if (!user) {
      const githubIdRandom = randomUUID()

      user = await prisma.user.create({
        data: {
          githubId: githubIdRandom,
          googleId: userInfo.id,
          login: userInfo.login,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
        },
      })
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )

    return { token }
  })

  app.post('/register', async (request) => {
    const bodySchema = z.object({
      code: z.string(),
    })

    const { code } = bodySchema.parse(request.body)

    const accessTokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      },
    )

    const { access_token } = accessTokenResponse.data

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const userSchema = z.object({
      id: z.string(),
      login: z.string(),
      name: z.string(),
      avatar_url: z.string().url(),
    })

    const userData = userResponse.data

    const userFormatted = {
      id: String(userData.id),
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
    } as User

    const userInfo = userSchema.parse(userFormatted)

    let user = await prisma.user.findUnique({
      where: {
        githubId: userInfo.id,
      },
    })

    if (!user) {
      const googleIdRandom = randomUUID()

      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          googleId: googleIdRandom,
          login: userInfo.login,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
        },
      })
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )

    return { token }
  })
}
