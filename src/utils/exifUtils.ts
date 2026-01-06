import exifr from "exifr";

/**
 * EXIF data extracted from an image, keyed by field name
 */
export type ExifData = Record<string, unknown>;

/**
 * Extract EXIF metadata from an image file using exifr
 *
 * @param file - The image file to extract EXIF data from
 * @returns A promise that resolves to the extracted EXIF data, or an empty object if extraction fails
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // Convert File to ArrayBuffer for cross-environment compatibility (Node.js and browser)
    const arrayBuffer = await file.arrayBuffer();

    // Parse all available metadata from the buffer
    const result = await exifr.parse(arrayBuffer, {
      // Include all metadata segments
      tiff: true,
      exif: true,
      gps: true,
      icc: true,
      iptc: true,
      xmp: true,
      // Return translated (human-readable) values
      translateValues: true,
      translateKeys: true,
      // Revive dates as Date objects
      reviveValues: true,
    });

    if (result && typeof result === "object") {
      return result as ExifData;
    }

    console.warn("EXIF extraction returned no data for file:", file.name);
    return {};
  } catch (error) {
    console.error("Failed to extract EXIF data from file:", file.name, error);
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
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string
): File {
  const byteCharacters = atob(base64);
  const byteNumbers = Array.from(
    { length: byteCharacters.length },
    (_, index) => byteCharacters.codePointAt(index) ?? 0
  );
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}
