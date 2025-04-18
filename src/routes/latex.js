import express from 'express'
import multer from 'multer'
import fs from 'fs-extra'
import path from 'path'
import { compileFile, deleteDirectory } from './../controllers/latex.js'
import { errorHandler } from './../middlewares/errorHandler.js'
import sendResponse from './../middlewares/sendResponse.js'
import env from './../config/config.js'
import { logger } from './../utils/service-response.js'

const router = express.Router()

// Read allowed file extensions from environment variable
const allowedFileExtensions = env.ALLOWED_FILE_EXTENSIONS.split(',').map(
  (ext) => ext.trim()
) // Split extensions

// Configure multer to store files in a dynamic directory and limit file size
const upload = multer({
  dest: env.FILE_UPLOADS_DIR || 'uploads/', // Allow directory customization
  limits: { fileSize: env.MAX_FILE_SIZE || 10 * 1024 * 1024 }, // Max file size: 10MB
  fileFilter: (_req, file, cb) => {
    // Check if file has an allowed extension
    const fileExtension = path.extname(file.originalname).toLowerCase()

    // If the file extension is not allowed, return an error
    if (!allowedFileExtensions.includes(fileExtension)) {
      logger.error(`Unsupported file extension: ${fileExtension}`)
      return cb(
        new Error(`Only ${allowedFileExtensions.join(', ')} files are allowed`),
        false
      ) // Explicitly cast error
    }
    cb(null, true)
  }
})

// Utility: Send the resulting PDF file and delete parent directory
const sendResultingFile = async (filePath, fileName, req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)

    stream.on('end', async () => {
      const parentDir = path.dirname(filePath)
      try {
        await fs.remove(parentDir)
        logger.info(`✔️ Deleted folder: ${parentDir}`)
      } catch (err) {
        errorHandler(err, req, res)
      }
    })

    stream.on('error', (err) => {
      errorHandler(err, req, res)
    })
  } catch (error) {
    errorHandler(error, req, res)
  }
}

// Upload & Compile Endpoint
router.post('/', upload.single('zip_file'), async (req, res) => {
  if (!req.file) {
    return sendResponse(
      res,
      false,
      'No file uploaded or invalid file type',
      undefined,
      400
    )
  }

  // Log the file upload
  logger.info(`File uploaded: ${req.file.filename}`)

  const filename = req.file.filename
  const fileExtension = path.extname(req.file.originalname).toLowerCase() // Get file extension from the original filename

  let compiler = req.body.compiler || 'pdflatex'
  if (!['pdflatex', 'latexmk', 'xelatex'].includes(compiler)) {
    compiler = 'pdflatex'
  }

  try {
    logger.info(`Compiling file with compiler: ${compiler}`)
    const result = await compileFile(compiler, filename, fileExtension)

    const pdfFiles = (await fs.readdir(result.directory)).filter((file) =>
      file.endsWith('.pdf')
    )

    if (pdfFiles.length === 0) {
      await deleteDirectory(result.directory) // cleanup before returning
      logger.warn('No PDF found after compilation')
      return sendResponse(res, false, 'No PDF found', undefined, 404)
    }

    const pdfFile = pdfFiles[0]
    const pdfPath = path.join(result.directory, pdfFile)

    try {
      // Try sending the file
      await sendResultingFile(pdfPath, pdfFile, req, res)
    } finally {
      // This will ALWAYS run, even if sendResultingFile throws an error
      await deleteDirectory(result.directory)
      logger.info(`Deleted directory: ${result.directory}`)
    }
  } catch (error) {
    errorHandler(error, req, res)
  }
})

export default router
