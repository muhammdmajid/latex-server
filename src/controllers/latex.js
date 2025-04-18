import fs from 'fs-extra'
import { exec } from 'child_process'
import { promisify } from 'util'
import cryptoJS from 'crypto-js'
import glob from 'glob'
import path from 'path'
import extractFile from './../utils/extraction-handler.js'
import env from './../config/config.js'
import { logger } from './../utils/service-response.js'

const execAsync = promisify(exec)
const globAsync = promisify(glob)

const compileFile = async (compiler, filename, fileExtension) => {
  // Ensure the `env.FILE_UPLOADS_DIR` is defined and fall back to 'uploads/'
  const parentDirectory = env.FILE_UPLOADS_DIR || 'uploads/'

  // Generate a random working directory inside the parent directory
  const workingDir = path.join(parentDirectory, randomValueHex(12))

  try {
    await fs.promises.mkdir(workingDir, { recursive: true })
    const oldZipPath = path.join(parentDirectory, filename)
    const newZipPath = path.join(workingDir, `zip${fileExtension}`)

    await fs.rename(oldZipPath, newZipPath)
    logger.info(`Successfully renamed zip: ${oldZipPath} to ${newZipPath}`)

    await extractZip(newZipPath, workingDir, fileExtension)

    const texFileName = await findTexFile(workingDir)
    logger.info(`Found .tex file: ${texFileName}`)

    const file = await compileTexFile(compiler, workingDir, texFileName)
    logger.info(`Compilation result: ${file}`)

    return { file, directory: workingDir }
  } catch (error) {
    logger.error(
      `Error in compileFile: ${error instanceof Error ? error.message : error}`
    )
    await deleteDirectory(workingDir)
    throw error
  }
}

const extractZip = async (filePath, destDir, fileExtension) => {
  try {
    await extractFile(filePath, destDir, fileExtension)
    logger.info(`Successfully extracted zip: ${filePath} to ${destDir}`)
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Failed to extract zip: ${err.message}`)
      throw new Error(`Failed to extract zip: ${err.message}`)
    } else {
      logger.error('An unknown error occurred during zip extraction')
      throw new Error('An unknown error occurred during zip extraction')
    }
  }
}

const findTexFile = async (directory) => {
  const files = await globAsync(path.join(directory, '*.tex'))

  if (!files.length) {
    logger.error('No .tex file found')
    throw new Error('No .tex file found')
  }

  const texFilePath = files[0]
  const fileStats = await fs.stat(texFilePath)

  if (fileStats.size === 0) {
    logger.error('The .tex file is empty')
    throw new Error('The .tex file is empty')
  }

  logger.info(`Found tex file: ${texFilePath}`)
  return path.basename(texFilePath)
}

const compileTexFile = async (compiler, directory, texFileName) => {
  const oldCwd = process.cwd()
  process.chdir(directory)

  const command = `${compiler} -halt-on-error -interaction=nonstopmode ${texFileName}`

  try {
    await execAsync(command)
    logger.info(`Successfully compiled ${texFileName} with ${compiler}`)
  } catch (error) {
    logger.warn(
      `LaTeX compilation failed: ${error instanceof Error ? error.message : error}`
    )
  } finally {
    process.chdir(oldCwd)
  }

  const outputFiles = await globAsync(path.join(directory, '*.{pdf,dvi,log}'))

  if (!outputFiles.length) {
    logger.error('No output file (PDF/DVI/LOG) found after compilation')
    throw new Error('No output file (PDF/DVI/LOG) found after compilation')
  }

  logger.info(`Found output file: ${outputFiles[0]}`)
  return outputFiles[0]
}

const randomValueHex = (len) => {
  return cryptoJS.lib.WordArray.random(len / 2).toString(cryptoJS.enc.Hex)
}

const deleteDirectory = async (directory) => {
  try {
    const exists = await fs.pathExists(directory)

    if (exists) {
      await fs.remove(directory)
      logger.info(`Directory ${directory} deleted successfully`)
    } else {
      throw new Error(`Directory ${directory} does not exist`)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error deleting directory: ${error.message}`)
    } else {
      logger.error('Unknown error occurred while deleting directory')
    }
    throw error
  }
}

export { compileFile, deleteDirectory }
