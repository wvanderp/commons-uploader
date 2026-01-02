import { parseMetadata } from '@uswriting/exiftool';

/**
 * EXIF data extracted from an image, keyed by field name
 */
export type ExifData = Record<string, unknown>;

/**
 * Extract EXIF metadata from an image file using WebAssembly-based ExifTool
 * 
 * @param file - The image file to extract EXIF data from
 * @returns A promise that resolves to the extracted EXIF data, or an empty object if extraction fails
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    const result = await parseMetadata(file, {
      args: ['-json', '-n'], // JSON output with numerical values
      transform: (data: string) => JSON.parse(data),
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      // ExifTool returns an array, we want the first (and usually only) element
      const exifObject = result.data[0] as Record<string, unknown>;
      // Remove file-specific metadata that isn't useful for templating
      const { SourceFile, FileName, Directory, FileSize, FileModifyDate, FileAccessDate, FileInodeChangeDate, FilePermissions, ...relevantData } = exifObject;
      
      // Suppress unused variable warnings
      void SourceFile;
      void FileName;
      void Directory;
      void FileSize;
      void FileModifyDate;
      void FileAccessDate;
      void FileInodeChangeDate;
      void FilePermissions;
      
      return relevantData;
    }

    console.warn('EXIF extraction returned no data for file:', file.name);
    return {};
  } catch (error) {
    console.error('Failed to extract EXIF data from file:', file.name, error);
    return {};
  }
}

/**
 * Convert a base64 string to a File object
 * 
 * @param base64 - The base64 encoded image data (without prefix)
 * @param filename - The filename to use
 * @param mimeType - The MIME type of the image
 * @returns A File object
 */
export function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = Array.from({ length: byteCharacters.length }, (_, index) => 
    byteCharacters.codePointAt(index) ?? 0
  );
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}
