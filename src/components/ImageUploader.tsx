import React, { useRef } from 'react';
import { useImageSetStore } from '../store/imageSetStore';

export const ImageUploader: React.FC = () => {
  const addImage = useImageSetStore((state) => state.addImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const [prefix, base64] = result.split(',');
            const mimeType = prefix.split(':')[1].split(';')[0];

            addImage({
              file: base64,
              name: file.name,
              mimeType,
              keys: {},
            });
          }
        };
        reader.readAsDataURL(file);
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-white text-black hover:bg-gray-200 font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
      >
        Add images to set
      </button>
    </section>
  );
};
