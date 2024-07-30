"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@map/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@map/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
  [
    {
      year: 1975,
      obesity_percentage: 11.7,
    },
    {
      year: 1976,
      obesity_percentage: 12.1,
    },
    {
      year: 1977,
      obesity_percentage: 12.4,
    },
    {
      year: 1978,
      obesity_percentage: 12.7,
    },
    {
      year: 1979,
      obesity_percentage: 13.1,
    },
    {
      year: 1980,
      obesity_percentage: 13.5,
    },
    {
      year: 1981,
      obesity_percentage: 13.9,
    },
    {
      year: 1982,
      obesity_percentage: 14.3,
    },
    {
      year: 1983,
      obesity_percentage: 14.8,
    },
    {
      year: 1984,
      obesity_percentage: 15.2,
    },
    {
      year: 1985,
      obesity_percentage: 15.8,
    },
    {
      year: 1986,
      obesity_percentage: 16.3,
    },
    {
      year: 1987,
      obesity_percentage: 16.9,
    },
    {
      year: 1988,
      obesity_percentage: 17.5,
    },
    {
      year: 1989,
      obesity_percentage: 18.1,
    },
    {
      year: 1990,
      obesity_percentage: 18.7,
    },
    {
      year: 1991,
      obesity_percentage: 19.4,
    },
    {
      year: 1992,
      obesity_percentage: 20.1,
    },
    {
      year: 1993,
      obesity_percentage: 20.8,
    },
    {
      year: 1994,
      obesity_percentage: 21.5,
    },
    {
      year: 1995,
      obesity_percentage: 22.3,
    },
    {
      year: 1996,
      obesity_percentage: 23.0,
    },
    {
      year: 1997,
      obesity_percentage: 23.8,
    },
    {
      year: 1998,
      obesity_percentage: 24.6,
    },
    {
      year: 1999,
      obesity_percentage: 25.4,
    },
    {
      year: 2000,
      obesity_percentage: 26.1,
    },
    {
      year: 2001,
      obesity_percentage: 26.9,
    },
    {
      year: 2002,
      obesity_percentage: 27.7,
    },
    {
      year: 2003,
      obesity_percentage: 28.4,
    },
    {
      year: 2004,
      obesity_percentage: 29.2,
    },
    {
      year: 2005,
      obesity_percentage: 29.9,
    },
    {
      year: 2006,
      obesity_percentage: 30.6,
    },
    {
      year: 2007,
      obesity_percentage: 31.3,
    },
    {
      year: 2008,
      obesity_percentage: 32.0,
    },
    {
      year: 2009,
      obesity_percentage: 32.7,
    },
    {
      year: 2010,
      obesity_percentage: 33.4,
    },
    {
      year: 2011,
      obesity_percentage: 34.0,
    },
    {
      year: 2012,
      obesity_percentage: 34.7,
    },
    {
      year: 2013,
      obesity_percentage: 35.4,
    },
    {
      year: 2014,
      obesity_percentage: 36.0,
    },
    {
      year: 2015,
      obesity_percentage: 36.7,
    },
    {
      year: 2016,
      obesity_percentage: 37.3,
    },
    {
      year: 2017,
      obesity_percentage: 38.2,
    },
    {
      year: 2018,
      obesity_percentage: 39.0,
    },
    {
      year: 2019,
      obesity_percentage: 39.8,
    },
    {
      year: 2020,
      obesity_percentage: 40.0,
    },
    {
      year: 2021,
      obesity_percentage: 41.0,
    },
    {
      year: 2022,
      obesity_percentage: 41.5,
    },
    {
      year: 2023,
      obesity_percentage: 42.0,
    },
    {
      year: 2024,
      obesity_percentage: 43.3,
    },
    {
      year: 2025,
      obesity_percentage: 44.6,
    },
    {
      year: 2026,
      obesity_percentage: 45.9,
    },
    {
      year: 2027,
      obesity_percentage: 47.2,
    },
    {
      year: 2028,
      obesity_percentage: 48.5,
    },
    {
      year: 2029,
      obesity_percentage: 49.8,
    },
    {
      year: 2030,
      obesity_percentage: 51.0,
    },
  ],
];

const chartConfig = {
  obesity: {
    label: "Obesity Percentage",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ObesityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Obesity Percentage</CardTitle>
        <CardDescription>1975 - 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData[0]} className="h-[300px]">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.toString()}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="year"
                  nameKey="obesity_percentage"
                  formatter={(value) =>
                    `${typeof value === "number" ? value.toFixed(1) : value}%`
                  }
                />
              }
            />
            <Bar dataKey="obesity_percentage" fill="black" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total obesity percentage from 1975 to 2024
        </div>
      </CardFooter>
    </Card>
  );
}
