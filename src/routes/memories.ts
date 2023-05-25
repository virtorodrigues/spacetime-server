import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import z from 'zod'
import { deleteImageFromAWS } from './upload'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    await request.jwtVerify()
  })

  app.get('/memories', async (request) => {
    const memories = await prisma.memory.findMany({
      where: {
        userId: request.user.sub,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    return memories.map((memory: any) => {
      return {
        id: memory.id,
        coverUrl: memory.coverUrl,
        createdAt: memory.createdAt,
        excerpt: memory.content.substring(0, 115).concat('...'),
      }
    })
  })

  app.get('/memories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (memory.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    return memory
  })

  app.post('/memories', async (request) => {
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
    })

    const { content, coverUrl } = bodySchema.parse(request.body)

    const memory = await prisma.memory.create({
      data: {
        content,
        coverUrl,
        userId: request.user.sub,
      },
    })

    return memory
  })

  app.put('/memories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      content: z.string(),
      oldCoverUrl: z.string(),
      coverUrl: z.string(),
    })

    const { content, coverUrl, oldCoverUrl } = bodySchema.parse(request.body)

    // delete the pic only when the new pic is different from old one
    if (oldCoverUrl !== coverUrl) {
      const urlAccessBucket = process.env.AWS_URL_ACCESS_BUCKET as string
      const imageName = oldCoverUrl.split(urlAccessBucket)[1]

      const responseImageDelete = await deleteImageFromAWS(imageName)
      if (!responseImageDelete || !responseImageDelete.success) {
        return reply.status(403).send(responseImageDelete.message)
      }
    }

    let memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (memory.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    memory = await prisma.memory.update({
      where: {
        id,
      },
      data: {
        content,
        coverUrl,
      },
    })

    return memory
  })

  app.delete('/memories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (memory.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    const urlAccessBucket = process.env.AWS_URL_ACCESS_BUCKET as string
    const imageName = memory.coverUrl.split(urlAccessBucket)[1]

    const responseImageDelete = await deleteImageFromAWS(imageName)
    if (!responseImageDelete || !responseImageDelete.success) {
      return reply.status(403).send(responseImageDelete.message)
    }

    await prisma.memory.delete({
      where: {
        id,
      },
    })
  })
}
