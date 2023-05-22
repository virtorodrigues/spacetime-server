import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { extname, resolve } from 'node:path'
import { createWriteStream } from 'node:fs'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
import { Storage } from '@google-cloud/storage'
import { request } from 'node:http'
import { format } from 'util'

const pump = promisify(pipeline)

const storage = new Storage({ keyFilename: 'google-cloud-key.json' })
const bucket = storage.bucket('bezkoder-e-commerce')

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 5_242_800, // 5mb
      },
    })

    if (!upload) {
      return reply.status(400).send()
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype)

    if (!isValidFileFormat) {
      return reply.status(400).send()
    }

    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const fileName = fileId.concat(extension)

    const blob = bucket.file(fileName)
    const blobStream = blob.createWriteStream({
      resumable: false,
    })

    blobStream.on('error', (err) => {
      reply.status(500).send({ message: err.message })
    })

    blobStream.on('finish', async (data) => {
      // Create URL for directly file access via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
      )

      try {
        // Make the file public
        await bucket.file(fileName).makePublic()
      } catch {
        return reply.status(500).send({
          message: `Uploaded the file successfully: ${fileName}, but public access is denied!`,
          url: publicUrl,
        })
      }

      reply.status(200).send({
        message: 'Uploaded the file successfully: ' + fileName,
        url: publicUrl,
      })
    })

    blobStream.end(request.file.buffer)

    /* const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads', fileName),
    )

    await pump(upload.file, writeStream)

    const fullUrl = request.protocol.concat('://').concat(request.hostname)
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()
    return { fileUrl }
    */
  })
}
