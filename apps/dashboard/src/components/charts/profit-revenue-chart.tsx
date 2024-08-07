// TODO: Implement getMetrics in @map/supabase/cached-queries
// import { getMetrics } from "@map/supabase/cached-queries";
import { cn } from "@map/ui/cn";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartData } from "./data";

export function ProfitRevenueChart({
  value,
  defaultValue,
  disabled,
  currency,
  type,
}) {
  // TODO: Replace this with actual data fetching once getMetrics is implemented
  const data = chartData;

  return (
    <div className="mt-5">
      <div className="space-y-2 mb-14 inline-block">
        <h1 className={cn("text-4xl font-mono", disabled && "skeleton-box")}>
          <FormatAmount
            amount={data.summary.currentTotal}
            currency={data.summary.currency}
          />
        </h1>
        <p className={cn("text-sm text-[#606060]", disabled && "skeleton-box")}>
          vs{" "}
          <FormatAmount
            maximumFractionDigits={0}
            minimumFractionDigits={0}
            amount={data.summary.prevTotal || 0}
            currency={data.summary.currency}
          />{" "}
          last period
        </p>
      </div>
      <BarChart data={data} disabled={disabled} currency={currency} />
    </div>
  );
}
