import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCLOUD_STORAGE_PROJECT_ID,
  credentials: {
    client_email: process.env.GCLOUD_STORAGE_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_STORAGE_PRIVATE_KEY,
  },
})

const bucketName = process.env.GCLOUD_STORAGE_BUCKET as string

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parts: any = request.parts()

      for await (const part of parts) {
        if (part.file) {
          const { filename, mimetype, file } = part

          const fileBuffer = await getBufferFromStream(file)
          await uploadToStorage(fileBuffer, filename, mimetype)

          const fileUrl = getFileUrl('asdasdasd.jpeg')
          reply.send({ success: true, fileUrl })
          return
        }
      }

      reply.code(400).send({ error: 'No file uploaded' })
    } catch (error) {
      console.error(error)
      reply.code(500).send({ error })
    }
  })
}
async function getBufferFromStream(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  // ): Promise<UploadResponse> {
) {
  const file = storage.bucket(bucketName).file(filename)
  file.save(buffer, {
    metadata: {
      contentType: mimetype,
    },
  })
}

function getFileUrl(filename: string): string {
  return `https://storage.googleapis.com/${bucketName}/${filename}`
}
