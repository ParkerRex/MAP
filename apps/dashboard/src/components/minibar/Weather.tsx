'use client';

import type { Welcome as WeatherData } from '@/types/weather';
import Image from 'next/image';
import React, { useEffect, useState, useCallback } from 'react';

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getWeatherData = useCallback(
    async (latitude: number, longitude: number) => {
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) {
        setError('API key is not set. Check your .env file.');
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
        setError('Failed to fetch weather data. Please try again.');
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
          'Failed to get location. Please check your permissions and try again.',
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
            Feels {Math.round(weatherData.main.feels_like)} °F in{' '}
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
