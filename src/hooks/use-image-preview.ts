import { useEffect, useState } from "react";

export const useImagePreview = (file: File | null) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    if (file && file instanceof File) {
      url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }

    // Cleanup function to revoke the created URL
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  return {
    preview,
  };
};
