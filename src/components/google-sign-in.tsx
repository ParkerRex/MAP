"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GoogleSignIn() {
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    // Dev mode: just redirect to home
    router.push("/");
  };

  return (
    <Button
      onClick={handleSignIn}
      className="active:scale-[0.98] bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Icons.Google />
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  );
}
