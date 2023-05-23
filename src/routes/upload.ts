import path, { extname } from 'node:path'
import { Storage } from '@google-cloud/storage'
import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { promisify } from 'util'
import { PassThrough, pipeline, Readable } from 'stream'

const pipelineAsync = promisify(pipeline)

// const keyFilename = path.join(__dirname, '/routes/google-cloud-key.json')

// const storage = new Storage({
//   keyFilename,
// })

const storage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_STORAGE_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_STORAGE_PRIVATE_KEY,
  },
})

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const parts = request.parts()

    for await (const part of parts) {
      if (part.file) {
        const fileBuffer = await getBufferFromStream(part.file)

        // Upload fileBuffer to Google Cloud Storage
        const bucketName = 'spacetime-bucket'

        const fileId = randomUUID()
        const extension = extname(part.filename)

        const destination = fileId.concat(extension)

        const bucket = storage.bucket(bucketName)
        const file = bucket.file(destination)
        await file.save(fileBuffer)

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`

        reply.send({ success: true, fileUrl })
      }
    }
  })
}

async function getBufferFromStream(stream: Readable): Promise<Buffer> {
  const passThrough = new PassThrough()
  const chunks: Buffer[] = []

  pipeline(stream, passThrough, (err) => {
    if (err) {
      throw err
    }
  })

  passThrough.on('data', (chunk) => {
    chunks.push(chunk)
  })

  await pipelineAsync(stream, passThrough)

  return Buffer.concat(chunks)
}
