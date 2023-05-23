import { extname } from 'node:path'
import { Storage } from '@google-cloud/storage'
import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { promisify } from 'node:util'
import { PassThrough, pipeline, Readable } from 'node:stream'

// const pipelineAsync = promisify(pipeline)

const storage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_STORAGE_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_STORAGE_PRIVATE_KEY,
  },
})

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const bucketName = process.env.GCLOUD_STORAGE_BUCKET as string

    const upload = await request.file()

    if (!upload) {
      return reply.status(500).send()
    }

    const destination = `ddddd.jpeg`

    const bucket = storage.bucket(bucketName)
    const blob = bucket.file(destination)

    await blob
      .createWriteStream({
        resumable: false,
      })
      .end('ddddd.jpeg')

    const fileUrl = `https://storage.googleapis.com/spacetime-bucket/5dd8e299-59be-4078-a5f8-f1a479153111.jpeg`
    reply.send({ success: true, fileUrl })
    /* const parts = request.parts() as any

    for await (const part of parts) {
      if (part.file) {
        // const fileBuffer = await getBufferFromStream(part.file)

        const buffers = []

        for await (const chunk of part.file) {
          buffers.push(chunk)
        }

        const fileBuffer = Buffer.concat(buffers)

        // Upload fileBuffer to Google Cloud Storage
        const bucketName = process.env.GCLOUD_STORAGE_BUCKET as string

        const fileId = randomUUID()
        const extension = extname(part.filename)

        const destination = fileId.concat(extension)

        const bucket = storage.bucket(bucketName)
        const file = bucket.file(destination)
        await file.save(fileBuffer)
      }
    }
    const fileUrl = `https://storage.googleapis.com/spacetime-bucket/5dd8e299-59be-4078-a5f8-f1a479153111.jpeg`
    reply.send({ success: true, fileUrl }) */
  })
}
