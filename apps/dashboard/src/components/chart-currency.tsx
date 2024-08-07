// TODO: Implement getBankAccountsCurrencies in @midday/supabase/cached-queries
// import { getBankAccountsCurrencies } from "@midday/supabase/cached-queries";
import { SelectChartCurrency } from "./select-chart-currency";

type Props = {
  defaultValue?: string;
};

export async function ChartCurrency({ defaultValue }: Props) {
  // TODO: Replace with actual implementation of getBankAccountsCurrencies
  const currencies = {
    data: [{ currency: "USD" }, { currency: "EUR" }, { currency: "GBP" }],
  };

  // NOTE: Only show if we have more than one currency
  if (currencies?.data && currencies?.data.length <= 1) {
    return null;
  }

  return (
    <SelectChartCurrency
      defaultValue={defaultValue}
      currencies={
        currencies?.data?.map(({ currency }) => ({
          id: currency,
          label: currency,
        })) ?? []
      }
    />
  );
}
