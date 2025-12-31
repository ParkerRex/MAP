import { useState } from "react";

// Dev mode stub for file uploads
async function upload(_options: {
  path: string;
  file: File;
  bucket: string;
}): Promise<string> {
  // Return a fake URL for dev mode
  console.warn("[Dev Mode] File upload is disabled. Returning stub URL.");
  return `/storage/${_options.path}`;
}

export function useUpload() {
  const [isLoading, setLoading] = useState(false);

  const uploadFile = async ({
    file,
    path,
    bucket,
  }: {
    file: File;
    path: string;
    bucket: string;
  }) => {
    setLoading(true);

    const url = await upload({
      path,
      file,
      bucket,
    });

    setLoading(false);

    return {
      url,
      path,
    };
  };

  return {
    uploadFile,
    isLoading,
  };
}
