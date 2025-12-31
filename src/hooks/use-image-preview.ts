import { useEffect, useMemo, useRef } from "react";

export const useImagePreview = (file: File | null) => {
  const prevUrlRef = useRef<string | null>(null);

  const preview = useMemo(() => {
    // Revoke previous URL when creating a new one
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
    }

    if (file && file instanceof File) {
      const url = URL.createObjectURL(file);
      prevUrlRef.current = url;
      return url;
    }

    prevUrlRef.current = null;
    return null;
  }, [file]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return {
    preview,
  };
};
