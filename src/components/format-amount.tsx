"use client";

import { formatAmount } from "@/utils/format";

type Props = {
  amount: number;
  currency: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function FormatAmount({
  amount,
  currency,
  maximumFractionDigits,
  minimumFractionDigits,
}: Props) {
  // Removed const locale = useCurrentLocale();

  return formatAmount({
    // Removed locale,
    amount: amount,
    currency: currency,
    maximumFractionDigits,
    minimumFractionDigits,
  });
}
