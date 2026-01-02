"use client";

import { getWeatherInfo, useWeather } from "@/hooks/use-weather";

export function WeatherWidget() {
  const { weather, isLoading, error } = useWeather();

  if (error || isLoading || !weather) {
    return null;
  }

  const { icon } = getWeatherInfo(weather.weatherCode);

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <span>{icon}</span>
      <span>{weather.temperature}°</span>
    </div>
  );
}
