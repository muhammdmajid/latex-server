import AdmZip from 'adm-zip'
import * as tar from 'tar'
import * as unrar from 'node-unrar-js'
import path from 'path'
import fs from 'fs-extra'
import { logger } from './../utils/service-response.js'

// Function to handle .zip extraction
const extractZip = (zipFilePath, destDir) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipFilePath)
      zip.extractAllTo(destDir, true)
      logger.info(
        `Successfully extracted .zip file: ${zipFilePath} to ${destDir}`
      )
      resolve()
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error extracting .zip file: ${error.message}`)
        reject(new Error(`Failed to extract .zip file: ${error.message}`))
      } else {
        logger.error('An unknown error occurred during .zip extraction.')
        reject(new Error('An unknown error occurred during extraction.'))
      }
    }
  })
}

// Function to handle .tar/.gz extraction
const extractTarGz = (tarFilePath, destDir) => {
  return new Promise((resolve, reject) => {
    try {
      tar.x({ file: tarFilePath, cwd: destDir })
      logger.info(
        `Successfully extracted .tar file: ${tarFilePath} to ${destDir}`
      )
      resolve()
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error extracting .tar file: ${error.message}`)
        reject(new Error(`Failed to extract .tar file: ${error.message}`))
      } else {
        logger.error('An unknown error occurred during .tar extraction.')
        reject(new Error('An unknown error occurred during extraction.'))
      }
    }
  })
}

// Function to extract files from a .rar archive
const extractRar = (rarFilePath, destDir) => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const buf = Uint8Array.from(fs.readFileSync(rarFilePath)).buffer
        const extractor = await unrar.createExtractorFromData({ data: buf })
        const fileList = extractor.getFileList()
        const fileHeaders = [...fileList.fileHeaders]

        await fs.promises.mkdir(destDir, { recursive: true })

        const extracted = extractor.extract({
          files: fileHeaders.map((header) => header.name)
        })
        const extractedFiles = Array.from(extracted.files)

        for (const file of extractedFiles) {
          const { fileHeader, extraction } = file

          if (extraction) {
            const extractedFilePath = path.join(destDir, fileHeader.name)
            await fs.promises.writeFile(
              extractedFilePath,
              Buffer.from(extraction)
            )
            logger.info(`Extracted: ${fileHeader.name}`)
          } else {
            logger.error(`No content extracted for file: ${fileHeader.name}`)
          }
        }

        logger.info('Extraction completed successfully.')
        resolve()
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error extracting .rar file: ${error.message}`)
          reject(new Error(`Failed to extract .rar file: ${error.message}`))
        } else {
          logger.error('An unknown error occurred during .rar extraction.')
          reject(new Error('An unknown error occurred during extraction.'))
        }
      }
    })()
  })
}

// Function to handle file extraction based on file extension
const extractFile = async (filePath, destDir, fileExtension) => {
  try {
    if (fileExtension === '.zip') {
      await extractZip(filePath, destDir)
    } else if (['.tar', '.gz', '.tgz'].includes(fileExtension)) {
      await extractTarGz(filePath, destDir)
    } else if (fileExtension === '.rar') {
      await extractRar(filePath, destDir)
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error during file extraction: ${error.message}`)
    } else {
      logger.error('An unknown error occurred during extraction.')
    }
  }
}

export default extractFile
