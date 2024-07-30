import { useEffect, useState } from 'react';

const useLastSelectedFolder = (initialFolderId: string | null) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('lastSelectedFolderId') || initialFolderId;
      }
      return initialFolderId;
    },
  );

  useEffect(() => {
    if (selectedFolderId) {
      localStorage.setItem('lastSelectedFolderId', selectedFolderId);
    }
  }, [selectedFolderId]);

  return [selectedFolderId, setSelectedFolderId] as const;
};

export default useLastSelectedFolder;
