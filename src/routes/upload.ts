import { extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIA36UV7CJSHDUMQZ6O',
        secretAccessKey: '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',
      },
    })
    const file = await request.file({
      limits: {
        fileSize: 5_242_800, // 5mb
      },
    })

    if (!file) {
      return reply.status(500).send('file not found')
    }

    const fileBuffer = await file.toBuffer()

    const fileId = randomUUID()
    const extension = extname(file.filename)
    const destination = fileId.concat(extension)

    const params = {
      Bucket: 'spacetime-bucket',
      Key: destination,
      Body: fileBuffer,
      ContentType: file.mimetype,
    }

    const uploadCommand = new PutObjectCommand(params)
    try {
      await s3Client.send(uploadCommand)
      const fileUrl = `https://spacetime-bucket.s3.amazonaws.com/${destination}`

      reply.status(200).send({ success: true, fileUrl })
    } catch (error) {
      reply.status(402).send({ success: false, error })
    }
  })
}

export async function deleteImageFromAWS(imageName: string) {
  try {
    const s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIA36UV7CJSHDUMQZ6O',
        secretAccessKey: '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',
      },
    })
    // Specify the S3 bucket name and the key of the image you want to delete
    const bucketName = 'spacetime-bucket'
    const key = imageName

    // Create the parameters object for the S3 delete operation
    const params = {
      Bucket: bucketName,
      Key: key,
    }

    const deleteCommand = new DeleteObjectCommand(params)

    await s3Client.send(deleteCommand)

    // Delete the image from the S3 bucket
    // await s3.deleteObject(params).promise()

    return { success: true, message: 'Image deleted successfully' }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, message: error }
  }
}
