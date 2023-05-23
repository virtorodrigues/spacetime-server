import { FastifyInstance } from 'fastify'

import { Storage } from '@google-cloud/storage'

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
    const parts = request.parts()
    let fileBuffer: any

    for await (const part of parts) {
      if (part.file) {
        const buffers = []

        for await (const chunk of part.file) {
          buffers.push(chunk)
        }
        fileBuffer = Buffer.concat(buffers)

        reply.send({ success: true, message: 'File uploaded successfully' })
      }
    }

    const destination = 'asd.jpeg'

    const bucket = storage.bucket(bucketName)
    const blob = bucket.file(destination)

    await blob.createWriteStream().end(fileBuffer)

    reply.send({ success: true, message: 'File uploaded successfully' })
  })
}
