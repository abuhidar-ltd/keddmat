import { useCallback } from 'react';

/**
 * Hook that picks an image using a standard file-input click on the web.
 */
export const useNativeImagePicker = () => {
  const isNative = false;

  const pickImage = useCallback(
    async (fileInputRef?: React.RefObject<HTMLInputElement>): Promise<File | null> => {
      fileInputRef?.current?.click();
      return null;
    },
    []
  );

  return { pickImage, isNative };
};