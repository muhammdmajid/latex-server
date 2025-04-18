import fs from 'fs-extra'
import { exec } from 'child_process'
import cryptoJS from 'crypto-js';
import fg from 'fast-glob';

import path from 'path'
import extractFile from '../utils/extraction-handler.js'
import env from '../config/config.js'
import { logger } from '../utils/service-response.js'

const execAsync = (command) => new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(stdout || stderr);
  });
});


const compileFile = async (compiler = 'pdflatex', filename, fileExtension) => {
  const parentDirectory = env.FILE_UPLOADS_DIR || 'uploads/'
  const workingDir = path.join(parentDirectory, randomValueHex(12))

  try {
    await fs.ensureDir(workingDir)
    const oldZipPath = path.join(parentDirectory, filename)
    const newZipPath = path.join(workingDir, `zip${fileExtension}`)

    await fs.rename(oldZipPath, newZipPath)
    logger.info(`Renamed zip: ${oldZipPath} → ${newZipPath}`)

   
    await extractFile(newZipPath, workingDir, fileExtension)
    const texFileName = await findTexFile(workingDir)
    logger.info(`.tex file located: ${texFileName} ,workingDir:${workingDir}`)

    const file = await compileTexFile(compiler, workingDir, texFileName)
    logger.info(`Compilation output file: ${file}`)

    return { file, directory: workingDir }
  } catch (error) {
    logger.error(`compileFile failed: ${error instanceof Error ? error.message : String(error)}`)
    await deleteDirectory(workingDir)
    throw error
  }
}

const findTexFile = async (directory) => {
  try {
    // Use environment variable or fallback to 'uploads/'
    const baseDir = env.FILE_UPLOADS_DIR || 'uploads/';
    // Resolve baseDir and directory to absolute paths
    const resolvedBaseDir = path.resolve(baseDir);
    const resolvedDirectory = path.resolve(directory);

    // Ensure the directory is within the base directory
    if (resolvedDirectory.startsWith(resolvedBaseDir)) {
      logger.info(`The path starts with the base directory: ${resolvedBaseDir}`);

      const exists = await fs.pathExists(directory);
      if (exists) {
        const files = await fg('*.tex', { cwd: directory, absolute: true });

        if (files.length === 0) {
          throw new Error('No .tex file found');
        }

        const texFilePath = files[0];
        const fileStats = await fs.stat(texFilePath);

        if (fileStats.size === 0) {
          throw new Error('The .tex file is empty');
        }

        return path.basename(texFilePath);
      } else {
        throw new Error('Directory does not exist');
      }
    } else {
      throw new Error(`The path ${resolvedDirectory} is outside the base directory: ${resolvedBaseDir}`);
    }
  } catch (error) {
    logger.error(`Error finding .tex file in directory ${directory}: ${error.message}`);
    throw error;  // Re-throwing error after logging for further handling
  }
};


const compileTexFile = async (compiler, directory, texFileName) => {

  // Store the original working directory
  const originalCwd = process.cwd();

  // Change to the specified directory where the .tex file is located
  process.chdir(directory);

  // Resolve the absolute path for the tex file
  const texFilePath = path.resolve(process.cwd(), texFileName);

  // Check if the tex file exists in the directory
  try {
    await fs.promises.access(texFilePath, fs.constants.F_OK);
  } catch (err) {
    // Log error if the tex file does not exist
    logger.error(`The tex file ${texFileName} does not exist in the directory: ${directory}`);
    throw new Error(`The tex file ${texFileName} does not exist`);
  }

  // Prepare the LaTeX compiler command
  const command = `${compiler} -halt-on-error -interaction=nonstopmode "${texFilePath}"`;

  // Execute the LaTeX compiler command
  try {
    const result = await execAsync(command);
    // Log success message and the compilation result
    logger.info(`${texFileName} compiled using ${compiler}`);
    logger.debug(result);  // Output the LaTeX compilation logs
  } catch ({ error, stderr }) {
    // Log error if compilation fails
    logger.error(`Compilation failed: ${error.message || error}`);
    logger.error(`stderr: ${stderr}`);
    throw new Error(`Compilation failed: ${error.message || error}`);
  } finally {
    // Restore the original working directory after the compilation process
    process.chdir(originalCwd);
  }

  // Search for the output files (PDF, DVI, LOG) in the directory
  const outputFiles = await fg('*.{pdf,dvi,log}', { cwd: directory, absolute: true });
  if (!outputFiles.length) {
    // If no output file is found, throw an error
    throw new Error('No output file (PDF/DVI/LOG) found after compilation');
  }

  // Return the first output file (usually a PDF or DVI file)
  return outputFiles[0];
};



const randomValueHex = (len) => {
  return cryptoJS.lib.WordArray.random(len / 2).toString(cryptoJS.enc.Hex)
}

const deleteDirectory = async (directory) => {
  try {
    // Use environment variable or fallback to 'uploads/'
    const baseDir = env.FILE_UPLOADS_DIR || 'uploads/';
    // Resolve baseDir and directory to absolute paths
    const resolvedBaseDir = path.resolve(baseDir);
    const resolvedDirectory = path.resolve(directory);

    // Ensure the directory is within the base directory
    if (resolvedDirectory.startsWith(resolvedBaseDir)) {
      logger.info(`The path starts with the base directory: ${resolvedBaseDir}`);

      const exists = await fs.pathExists(directory);
      if (exists) {
        await fs.remove(directory);
        logger.info(`Successfully deleted directory: ${directory}`);
      } else {
        logger.warn(`Directory not found: ${directory}`);
      }
    } else {
      const errorMessage = `The path ${resolvedDirectory} does not start with the base directory: ${resolvedBaseDir}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);  // Ensuring path safety by throwing error
    }
  } catch (error) {
    logger.error(`Error deleting directory ${directory}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;  // Re-throwing error after logging for further handling
  }
};



export { compileFile, deleteDirectory }
