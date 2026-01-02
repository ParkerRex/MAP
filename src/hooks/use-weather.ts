"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

// WMO Weather interpretation codes
const weatherCodeToIcon: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Clear" },
  1: { icon: "🌤️", label: "Mostly clear" },
  2: { icon: "⛅", label: "Partly cloudy" },
  3: { icon: "☁️", label: "Overcast" },
  45: { icon: "🌫️", label: "Foggy" },
  48: { icon: "🌫️", label: "Icy fog" },
  51: { icon: "🌧️", label: "Light drizzle" },
  53: { icon: "🌧️", label: "Drizzle" },
  55: { icon: "🌧️", label: "Heavy drizzle" },
  61: { icon: "🌧️", label: "Light rain" },
  63: { icon: "🌧️", label: "Rain" },
  65: { icon: "🌧️", label: "Heavy rain" },
  66: { icon: "🌨️", label: "Freezing rain" },
  67: { icon: "🌨️", label: "Heavy freezing rain" },
  71: { icon: "❄️", label: "Light snow" },
  73: { icon: "❄️", label: "Snow" },
  75: { icon: "❄️", label: "Heavy snow" },
  77: { icon: "🌨️", label: "Snow grains" },
  80: { icon: "🌦️", label: "Light showers" },
  81: { icon: "🌦️", label: "Showers" },
  82: { icon: "🌦️", label: "Heavy showers" },
  85: { icon: "🌨️", label: "Light snow showers" },
  86: { icon: "🌨️", label: "Snow showers" },
  95: { icon: "⛈️", label: "Thunderstorm" },
  96: { icon: "⛈️", label: "Thunderstorm with hail" },
  99: { icon: "⛈️", label: "Severe thunderstorm" },
};

export function getWeatherInfo(code: number) {
  return weatherCodeToIcon[code] ?? { icon: "🌡️", label: "Unknown" };
}

async function fetchWeather(location: GeoLocation): Promise<WeatherData> {
  const { latitude, longitude } = location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = await response.json();
  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
  };
}

export function useWeather() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationError("Location access denied");
      },
      { timeout: 10000, maximumAge: 600000 }, // Cache for 10 min
    );
  }, []);

  const query = useQuery({
    queryKey: ["weather", location?.latitude, location?.longitude],
    queryFn: () => fetchWeather(location!),
    enabled: !!location,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 min
  });

  return {
    weather: query.data,
    isLoading: !location || query.isLoading,
    error: locationError || (query.error ? "Failed to fetch weather" : null),
  };
}
