// TODO: Modify this to be specific to calendar
"use client";

import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";

export function AddAccountButton() {
  const [_, setStep] = useQueryState("step");

  return (
    <Button
      data-event="Add account"
      data-icon="🏦"
      data-channel="bank"
      onClick={() => setStep("connect")}
    >
      Add account
    </Button>
  );
}
