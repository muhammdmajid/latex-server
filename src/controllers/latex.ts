import fs from 'fs-extra'
import { exec } from 'child_process'
import { promisify } from 'util'
import cryptoJS from 'crypto-js'
import glob from 'glob'
import path from 'path'
import extractFile from '@/utils/extraction-handler.js'
import env from '@/config/config.js';
const execAsync = promisify(exec)
const globAsync = promisify(glob)

interface CompilationResult {
  file: string
  directory: string
}

const compileFile = async (
  compiler: string,
  filename: string,
  fileExtension: string,
): Promise<CompilationResult> => {
  // Ensure the `env.FILE_UPLOADS_DIR` is defined and fall back to 'uploads/'
  const parentDirectory = env.FILE_UPLOADS_DIR || 'uploads/'

  // Generate a random working directory inside the parent directory
  const workingDir = path.join(parentDirectory, randomValueHex(12))

  // Ensure the working directory exists (optional, depends on use case)
  await fs.promises.mkdir(workingDir, { recursive: true })

  // Construct the path for the old ZIP file
  const oldZipPath = path.join(parentDirectory, filename)

  // Create the new ZIP file path within the working directory
  const newZipPath = path.join(workingDir, `zip${fileExtension}`)

  try {
    await fs.mkdirp(workingDir)
    await fs.rename(oldZipPath, newZipPath)
    await extractZip(newZipPath, workingDir, fileExtension)

    const texFileName = await findTexFile(workingDir)
    const file = await compileTexFile(compiler, workingDir, texFileName)

    return { file, directory: workingDir }
  } catch (error) {
    await deleteDirectory(workingDir)
    throw error
  }
}

const extractZip = async (
  filePath: string,
  destDir: string,
  fileExtension: string
): Promise<void> => {
  try {
    // Call the function to extract the file based on its extension
    await extractFile(filePath, destDir,fileExtension)
  } catch (err: unknown) {
    // Type guard to check if err is an instance of Error
    if (err instanceof Error) {
      throw new Error(`Failed to extract zip: ${err.message}`)
    } else {
      throw new Error('An unknown error occurred during zip extraction')
    }
  }
}

const findTexFile = async (directory: string): Promise<string> => {
  const files = await globAsync(path.join(directory, '*.tex'))

  if (!files.length) {
    throw new Error('No .tex file found')
  }

  const texFilePath = files[0]
  const fileStats = await fs.stat(texFilePath)

  if (fileStats.size === 0) {
    throw new Error('The .tex file is empty')
  }

  return path.basename(texFilePath)
}

const compileTexFile = async (
  compiler: string,
  directory: string,
  texFileName: string
): Promise<string> => {
  const oldCwd = process.cwd()
  process.chdir(directory)

  const command = `${compiler} -halt-on-error -interaction=nonstopmode ${texFileName}`

  try {
    await execAsync(command)
  } catch (error: unknown) {
    // Type guard to check if error is an instance of Error
    if (error instanceof Error) {
      console.warn(`LaTeX compilation failed: ${error.message}`)
    } else {
      console.warn('LaTeX compilation failed with an unknown error')
    }
  } finally {
    process.chdir(oldCwd)
  }

  const outputFiles = await globAsync(path.join(directory, '*.{pdf,dvi,log}'))

  if (!outputFiles.length) {
    throw new Error('No output file (PDF/DVI/LOG) found after compilation')
  }

  return outputFiles[0]
}

// Updated randomValueHex function using crypto-js
const randomValueHex = (len: number): string => {
  return cryptoJS.lib.WordArray.random(len / 2).toString(cryptoJS.enc.Hex)
}

const deleteDirectory = async (directory: string): Promise<void> => {
  try {
    // Check if the directory exists
    const exists = await fs.pathExists(directory)

    if (exists) {
      // Delete the directory if it exists
      await fs.remove(directory)
      console.log(`Directory ${directory} deleted successfully`)
    } else {
      // Throw an error if the directory does not exist
      throw new Error(`Directory ${directory} does not exist`)
    }
  } catch (error: unknown) {
    // Type assertion to `Error` to handle it as a standard error object
    if (error instanceof Error) {
      console.error(`Error:`, error.message)
    } else {
      console.error(`Unknown error occurred`)
    }
    throw error // Rethrow the error to be handled by the caller
  }
}

export { compileFile, deleteDirectory }
