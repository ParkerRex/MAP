"use client";

import { Button } from "@/components/ui/button";

type Props = {
  disableActions?: boolean;
};

export function UploadButton({ disableActions }: Props) {
  return (
    <Button
      variant="outline"
      disabled={disableActions}
      onClick={() => document.getElementById("upload-files")?.click()}
    >
      Upload
    </Button>
  );
}
