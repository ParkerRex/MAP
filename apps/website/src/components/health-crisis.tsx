import NumberTicker from "@map/ui/number-ticker";
import React from "react";
import { ObesityChart } from "./obesity-chart";

function HealthCrisis() {
  return (
    <section className="w-full bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl mb-8 text-left">
          OUR HEALTH CRISIS IS GROWING
        </h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="mb-8">
              <h4 className="mb-2 flex items-center whitespace-pre-wrap text-8xl font-medium tracking-tightest text-black dark:text-white">
                <NumberTicker value={90} />%
              </h4>
              <p className="text-lg">
                leading causes of death in America are from preventable chronic
                diseases
              </p>
            </div>
            <div className="mb-8">
              <h4 className="mb-2 flex items-center whitespace-pre-wrap text-8xl font-medium tracking-tightest text-black dark:text-white">
                <NumberTicker value={91} />%
              </h4>
              <p className="text-lg">
                of the largest killers of Americans are directly tied to food
                and lifestyle factors
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center whitespace-pre-wrap text-8xl font-medium tracking-tightest text-black dark:text-white">
                <NumberTicker value={98} />%
              </h4>
              <p className="text-lg">
                of all healthcare spend goes towards treatment, not prevention
              </p>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <ObesityChart />
          </div>
        </div>
        <div className="mt-16 w-full">
          <h3 className="text-2xl font-bold mb-4">THE HEALTH CRISIS</h3>
          <p className="text-lg mb-4">
            The health crisis in America is reaching critical levels.
            Preventable chronic diseases account for the majority of deaths and
            medical costs. Our lifestyle choices, particularly our diet, are the
            root cause of most health issues.
          </p>
          <p className="text-lg">
            Despite this, our healthcare system focuses overwhelmingly on
            treatment rather than prevention. It's time for a paradigm shift in
            how we approach health and wellness.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HealthCrisis;
