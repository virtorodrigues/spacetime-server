import { FastifyInstance } from 'fastify'

import { Storage } from '@google-cloud/storage'
import { randomUUID } from 'crypto'
import { extname } from 'path'

const storage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_STORAGE_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_STORAGE_PRIVATE_KEY,
  },
})

const bucketName = 'spacetime-bucket'

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    const parts: any = request.parts()

    let fileBuffer: any

    let filename = ''

    for await (const part of parts) {
      if (part.file) {
        const buffers = []

        const fileId = randomUUID()
        const extension = extname(part.filename)

        filename = fileId.concat(extension)

        for await (const chunk of part.file) {
          buffers.push(chunk)
        }
        fileBuffer = Buffer.concat(buffers)
      }
    }

    const bucket = storage.bucket(bucketName)
    const blob = bucket.file(filename)

    await blob.createWriteStream().end(fileBuffer)

    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`

    reply.send({ success: true, fileUrl })
  })
}
