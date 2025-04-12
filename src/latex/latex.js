import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import rimraf from 'rimraf';
import admZip from 'adm-zip';
import cryptoJS from 'crypto-js'; // Importing crypto-js
import glob from 'glob';
import path from 'path';

const execAsync = promisify(exec);
const globAsync = promisify(glob);
const rimrafAsync = promisify(rimraf);

const compileFile = async (compiler, filename) => {
  const parentDirectory = 'uploads/';
  const workingDir = path.join(parentDirectory, randomValueHex(12));
  const oldZipPath = path.join(parentDirectory, filename);
  const newZipPath = path.join(workingDir, 'zip.zip');

  try {
    await fs.mkdirp(workingDir); // Using fs-extra for mkdirp
    await fs.rename(oldZipPath, newZipPath);
    await extractZip(workingDir, newZipPath);

    const texFileName = await findTexFile(workingDir);
    const file = await compileTexFile(compiler, workingDir, texFileName);

    return { file, directory: workingDir };
  } catch (error) {
    await deleteDirectory(workingDir);
    throw error;
  }
};

const extractZip = async (directory, zipPath) => {
  try {
    const zip = new admZip(zipPath);
    zip.extractAllTo(directory, true);
  } catch (err) {
    throw new Error(`Failed to extract zip: ${err.message}`);
  }
};

const findTexFile = async (directory) => {
  const files = await globAsync(path.join(directory, '*.tex'));

  if (!files.length) {
    throw new Error('No .tex file found');
  }

  const texFilePath = files[0];
  const fileStats = await fs.stat(texFilePath);

  if (fileStats.size === 0) {
    throw new Error('The .tex file is empty');
  }

  return path.basename(texFilePath);
};

const compileTexFile = async (compiler, directory, texFileName) => {
  const oldCwd = process.cwd();
  process.chdir(directory);

  const command = `${compiler} -halt-on-error -interaction=nonstopmode ${texFileName}`;

  try {
    await execAsync(command);
  } catch (error) {
    console.warn(`LaTeX compilation failed: ${error.message}`);
    // Continue even on failure to check for logs
  } finally {
    process.chdir(oldCwd);
  }

  const outputFiles = await globAsync(path.join(directory, '*.{pdf,dvi,log}'));

  if (!outputFiles.length) {
    throw new Error('No output file (PDF/DVI/LOG) found after compilation');
  }

  return outputFiles[0];
};

// Updated randomValueHex function using crypto-js
const randomValueHex = (len) => {
  return cryptoJS.lib.WordArray.random(len / 2).toString(cryptoJS.enc.Hex);
};

const deleteDirectory = async (directory) => {
  await rimrafAsync(directory);
};

export {
  compileFile,
  deleteDirectory
};
