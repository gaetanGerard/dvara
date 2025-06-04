import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { File as MulterFile } from 'multer';

/**
 * Generates a unique file name (only underscores, no special chars) for a media upload.
 * Ensures uniqueness both in the database and on disk.
 *
 * @param prisma - PrismaClient instance for DB checks
 * @param uploadPath - Directory where the file will be stored
 * @param file - Multer file object (buffer, originalname, etc.)
 * @param name - Optional base name for the file (otherwise uses originalname)
 * @returns A unique file name (string) with suffix _timestamp_random
 * @throws BadRequestException if a unique name cannot be generated after 10 tries
 *
 * Usage example:
 *   const imgName = await generateUniqueMediaFileName(prisma, './uploads/media', file, name);
 *   // Use imgName to save the file and in your DB
 */
export async function generateUniqueMediaFileName(
  prisma: PrismaClient,
  uploadPath: string,
  file: MulterFile,
  name?: string,
): Promise<string> {
  const original = String(file.originalname);
  const ext = path.extname(original);
  const baseName = name
    ? String(name).replace(/[^a-zA-Z0-9_]/g, '_')
    : path.basename(original, ext).replace(/[^a-zA-Z0-9_]/g, '_');
  let imgName: string = '';
  let tryCount = 0;
  do {
    const suffix = `_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    imgName = `${baseName}${suffix}${ext}`;
    tryCount++;
    // Check uniqueness in DB
    const existsInDb = await prisma.media.findUnique({
      where: { imgName },
    });
    // Check uniqueness on disk
    const existsOnDisk = fs.existsSync(
      path.join(String(uploadPath), String(imgName)),
    );
    if (!existsInDb && !existsOnDisk) break;
  } while (tryCount < 10);
  if (tryCount === 10) {
    throw new BadRequestException('Could not generate a unique file name.');
  }
  return String(imgName);
}
