import React, { useRef } from 'react';
import { useImageSetStore } from '../store/imageSetStore';
import { extractExifData } from '../utils/exifUtils';

export const ImageUploader: React.FC = () => {
  const addImage = useImageSetStore((state) => state.addImage);
  const fileInputReference = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files) {
      for (const file of files) {
        // Extract EXIF data first (before FileReader consumes the file)
        const exifData = await extractExifData(file);

        const reader = new FileReader();
        reader.addEventListener('load', (e) => {
          const result = e.target?.result as string;
          if (result) {
            const [prefix, base64] = result.split(',');
            const mimeType = prefix.split(':')[1].split(';')[0];

            addImage({
              file: base64,
              name: file.name,
              mimeType,
              keys: {},
              exifData,
            });
          }
        });
        reader.readAsDataURL(file);
      }
      // Reset input
      if (fileInputReference.current) {
        fileInputReference.current.value = '';
      }
    }
  }

  return (
    <section>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputReference}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputReference.current?.click()}
        className="rounded-lg bg-white px-6 py-3 font-medium text-black shadow-sm transition-colors hover:bg-gray-200"
      >
        Add images to set
      </button>
    </section>
  );
};
