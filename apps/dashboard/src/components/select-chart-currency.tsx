"use client";

// TODO: Implement changeChartCurrencyAction in @/actions/change-chart-currency
// import { changeChartCurrencyAction } from "@/actions/change-chart-currency";
import { cn } from "@map/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@map/ui/select";
// TODO: Replace with actual implementation when changeChartCurrencyAction is available
// import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  defaultValue?: string;
  className?: string;
  currencies: {
    id: string;
    label: string;
  }[];
};

export function SelectChartCurrency({
  currencies,
  defaultValue,
  className,
}: Props) {
  // TODO: Replace with actual implementation when changeChartCurrencyAction is available
  // const { execute, optimisticState } = useOptimisticAction(
  //   changeChartCurrencyAction,
  //   {
  //     currentState: defaultValue,
  //     updateFn: (_, newState) => newState,
  //   },
  // );

  // Stub for optimisticState
  const optimisticState = defaultValue;

  // Stub for execute function
  const execute = (value: string) => {
    console.log("Currency changed to:", value);
    // In a real implementation, this would update the state
  };

  return (
    <Select
      defaultValue={optimisticState || currencies.at(0)?.id}
      onValueChange={execute}
    >
      <SelectTrigger className={cn("w-[90px] font-medium", className)}>
        <span>{optimisticState}</span>
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
