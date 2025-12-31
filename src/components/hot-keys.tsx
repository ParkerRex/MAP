"use client";

import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";

export function HotKeys() {
  const router = useRouter();

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    router.push("/settings");
  });

  useHotkeys("ctrl+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  useHotkeys("meta+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  return null;
}
