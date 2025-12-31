import { InsightInput } from "./insight-input";
import { InsightList } from "./insight-list";

export async function InsightsWidget() {
  return (
    <div>
      <div className="mt-8 overflow-auto scrollbar-hide pb-28 aspect-square">
        <InsightList />
      </div>
      <InsightInput />
    </div>
  );
}
