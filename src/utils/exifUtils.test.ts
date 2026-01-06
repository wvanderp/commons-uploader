import { describe, it, expect, beforeAll } from "vitest";
import { base64ToFile, extractExifData } from "./exifUtils";

describe("base64ToFile", () => {
  it("should convert a base64 string to a File object", () => {
    // A minimal valid base64 string (represents "Hello")
    const base64 = "SGVsbG8=";
    const filename = "test.txt";
    const mimeType = "text/plain";

    const file = base64ToFile(base64, filename, mimeType);

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe(filename);
    expect(file.type).toBe(mimeType);
  });

  it("should create file with correct content", async () => {
    const base64 = "SGVsbG8gV29ybGQ="; // "Hello World"
    const file = base64ToFile(base64, "test.txt", "text/plain");

    const text = await file.text();
    expect(text).toBe("Hello World");
  });

  it("should handle empty base64 string", () => {
    const base64 = "";
    const file = base64ToFile(base64, "empty.txt", "text/plain");

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(0);
  });

  it("should handle image MIME types", () => {
    // Minimal base64 representing some binary data
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const file = base64ToFile(base64, "image.png", "image/png");

    expect(file.name).toBe("image.png");
    expect(file.type).toBe("image/png");
    expect(file.size).toBeGreaterThan(0);
  });

  it("should preserve filename with special characters", () => {
    const base64 = "dGVzdA=="; // "test"
    const filename = "my file (2024).jpg";
    const file = base64ToFile(base64, filename, "image/jpeg");

    expect(file.name).toBe(filename);
  });

  it("should handle large base64 strings", () => {
    // Generate a larger base64 string
    const originalString = "A".repeat(1000);
    const base64 = btoa(originalString);
    const file = base64ToFile(base64, "large.txt", "text/plain");

    expect(file.size).toBe(1000);
  });
});

describe("extractExifData", () => {
  const WIKIMEDIA_IMAGE_URL =
    "https://commons.wikimedia.org/wiki/Special:FilePath/ParkShuttle_autonomous_bus_Capelle_aan_den_IJssel_-_2024-03-11.jpg";
  let testFile: File | null = null;

  beforeAll(async () => {
    // Download sample image from Wikimedia Commons for each test
    try {
      const response = await fetch(WIKIMEDIA_IMAGE_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      testFile = new File([blob], "ParkShuttle_autonomous_bus.jpg", {
        type: "image/jpeg",
      });
    } catch (error) {
      console.warn("Failed to download test image:", error);
      throw error;
    }
  });

  it("should return object when parsing succeeds", async () => {
    if (!testFile) {
      throw new Error("Test file not initialized");
    }

    console.log("Testing with file:", testFile.name, "size:", testFile.size);

    const exifData = await extractExifData(testFile);

    console.log("Extracted EXIF data:", exifData);

    expect(typeof exifData).toBe("object");
    expect(exifData).not.toBeNull();

    // Check for common EXIF fields that contain image dimensions
    // exifr uses ExifImageWidth/ExifImageHeight for dimensions
    const hasImageWidth =
      "ImageWidth" in exifData || "ExifImageWidth" in exifData;
    const hasImageHeight =
      "ImageHeight" in exifData || "ExifImageHeight" in exifData;

    expect(hasImageWidth || hasImageHeight).toBe(true);

    // These file-system specific fields should not be present
    // (they were from the old exiftool library, exifr doesn't include them)
    expect(exifData).not.toHaveProperty("SourceFile");
    expect(exifData).not.toHaveProperty("FileName");
    // Note: exifr may return "Directory" from XMP metadata (different from filesystem path)
    expect(exifData).not.toHaveProperty("FileSize");
    expect(exifData).not.toHaveProperty("FileModifyDate");
    expect(exifData).not.toHaveProperty("FileAccessDate");
    expect(exifData).not.toHaveProperty("FileInodeChangeDate");
    expect(exifData).not.toHaveProperty("FilePermissions");

    // The ParkShuttle image should have camera information
    const hasMakeOrModel = "Make" in exifData || "Model" in exifData;

    expect(hasMakeOrModel).toBe(true);
  });
});
