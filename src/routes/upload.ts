import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

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
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const parts = request.parts()

    for await (const part of parts) {
      if (part.file) {
        const { filename, mimetype } = part
        const bucketName = 'spacetime-bucket' // Replace with your bucket name

        const file = storage.bucket(bucketName).file(filename)
        const writeStream = file.createWriteStream({
          metadata: {
            contentType: mimetype,
          },
        })

        part.file.pipe(writeStream)

        await new Promise((resolve, reject) => {
          writeStream.on('error', reject)
          writeStream.on('finish', resolve)
        })

        const fileUrl = `https://storage.googleapis.com/${bucketName}/${filename}`
        reply.send({ success: true, fileUrl })
      }
    }
  })
}
