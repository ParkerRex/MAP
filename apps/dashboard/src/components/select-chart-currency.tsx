"use client";

import { cn } from "@map/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@map/ui/select";
import { useState } from "react";

type Props = {
  defaultValue?: string;
  className?: string;
  currencies: {
    id: string;
    label: string;
  }[];
  onChange?: (value: string) => void;
};

export function SelectChartCurrency({
  currencies,
  defaultValue,
  className,
  onChange,
}: Props) {
  const [value, setValue] = useState(defaultValue || currencies.at(0)?.id);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Select defaultValue={value} onValueChange={handleChange}>
      <SelectTrigger className={cn("w-[90px] font-medium", className)}>
        <span>{value}</span>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => {
          return (
            <SelectItem key={currency.id} value={currency.id}>
              {currency.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
