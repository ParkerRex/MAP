"use client";

import type { Welcome as WeatherData } from "@/types/weather";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";

export interface Welcome {
  coord: Coord;
  weather: Weather[];
  base: string;
  main: Main;
  visibility: number;
  wind: Wind;
  rain: Rain;
  clouds: Clouds;
  dt: number;
  sys: Sys;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface Clouds {
  all: number;
}

export interface Coord {
  lon: number;
  lat: number;
}

export interface Main {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level: number;
  grnd_level: number;
}

export interface Rain {
  "1h": number;
}

export interface Sys {
  type: number;
  id: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Wind {
  speed: number;
  deg: number;
  gust: number;
}

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getWeatherData = useCallback(
    async (latitude: number, longitude: number) => {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) {
        setError("API key is not set. Check your .env file.");
        return;
      }

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`,
        );
        const data = await response.json();
        if (data.cod !== 200) {
          throw new Error(data.message);
        }
        setWeatherData(data);
        setError(null);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch weather data. Please try again.");
      }
    },
    [],
  );

  const fetchWeatherWithRetry = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getWeatherData(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error(error);
        setError(
          "Failed to get location. Please check your permissions and try again.",
        );
      },
    );
  }, [getWeatherData]);

  useEffect(() => {
    fetchWeatherWithRetry();
  }, [fetchWeatherWithRetry]);

  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(
        () => {
          setRetryCount((prevCount) => prevCount + 1);
          fetchWeatherWithRetry();
        },
        2 ** retryCount * 1000,
      ); // Exponential backoff: 1s, 2s, 4s

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchWeatherWithRetry]);

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchWeatherWithRetry();
  };

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <p className="text-xs text-slate-600 dark:text-slate-300">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {weatherData ? (
        <div className="flex items-center space-x-2">
          <div className="dark:bg-slate-900 bg-slate-400 rounded-bl-lg px-2">
            <Image
              src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
              alt="Weather icon"
              width={24}
              height={24}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-100">
            Feels {Math.round(weatherData.main.feels_like)} °F in{" "}
            {weatherData.name} with {weatherData.weather[0].description}.
            Humidity: {weatherData.main.humidity}%.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Loading weather data...
        </p>
      )}
    </div>
  );
}
