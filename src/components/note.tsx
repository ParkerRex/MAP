import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

type UpdateValues = {
  id: string;
  note?: string | null;
};

type Props = {
  id: string;
  defaultValue: string;
  updateTransaction: (values: UpdateValues) => void;
};

export function Note({ id, defaultValue, updateTransaction }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Textarea
      name="feedback"
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() => {
        updateTransaction({
          id,
          note: value?.length > 0 ? value : null,
        });
      }}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
