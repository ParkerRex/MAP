import { calculateAvgBurnRate } from "@/utils/format";
// TODO: Implement getBurnRate and getRunway in @map/supabase/cached-queries
// import { getBurnRate, getRunway } from "@map/supabase/cached-queries";
import { Icons } from "@map/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@map/ui/tooltip";
import { FormatAmount } from "../format-amount";
import { AreaChart } from "./area-chart";

type Props = {
  value: unknown;
  defaultValue: unknown;
  currency: string;
};

export async function BurnRateChart({ value, defaultValue, currency }: Props) {
  // TODO: Replace with actual implementation of getBurnRate and getRunway
  const getBurnRate = async () => ({
    data: [
      { date: "2023-01-01", value: 5000 },
      { date: "2023-02-01", value: 5500 },
      { date: "2023-03-01", value: 4800 },
      // Add more dummy data as needed
    ],
  });

  const getRunway = async () => ({ data: 6 }); // 6 months runway

  const [{ data: burnRateData }, { data: runway }] = await Promise.all([
    getBurnRate(),
    getRunway(),
  ]);

  return (
    <div className="mt-5">
      <div className="space-y-2 mb-14">
        <h1 className="text-4xl font-mono">
          <FormatAmount
            amount={calculateAvgBurnRate(burnRateData)}
            currency={currency}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <span>
            {runway && runway > 0
              ? `${runway} months runway`
              : "Average burn rate"}
          </span>
          {runway && runway > 0 && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icons.Info className="h-4 w-4 mt-1" />
                </TooltipTrigger>
                <TooltipContent className="px-3 py-1.5 text-xs">
                  Average burn rate / Total balance
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="h-[260px]">
        <AreaChart currency={currency} data={burnRateData} />
      </div>
    </div>
  );
}
