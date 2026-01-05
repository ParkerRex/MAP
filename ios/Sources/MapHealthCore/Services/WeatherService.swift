import CoreLocation
import Foundation

public struct WeatherData {
    public let temperature: Int
    public let weatherCode: Int
    public let isDay: Bool

    public var icon: String {
        weatherIconForCode(weatherCode, isDay: isDay)
    }

    public var conditionText: String {
        weatherConditionForCode(weatherCode)
    }
}

public struct DailyForecast: Identifiable {
    public let date: Date
    public let high: Int
    public let low: Int
    public let weatherCode: Int

    public var id: Date { date }
    public var icon: String { weatherIconForCode(weatherCode, isDay: true) }
    public var conditionText: String { weatherConditionForCode(weatherCode) }
}

public actor WeatherService {
    public static let shared = WeatherService()

    private var cachedWeather: WeatherData?
    private var lastFetchTime: Date?
    private var cachedForecast: [DailyForecast]?
    private var lastForecastFetchTime: Date?
    private let cacheValiditySeconds: TimeInterval = 600 // 10 minutes

    private init() {}

    public func getCurrentWeather(latitude: Double, longitude: Double) async throws -> WeatherData {
        // Return cached data if still valid
        if let cached = cachedWeather,
           let lastFetch = lastFetchTime,
           Date().timeIntervalSince(lastFetch) < cacheValiditySeconds {
            return cached
        }

        let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(latitude)&longitude=\(longitude)&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit")!

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.fetchFailed
        }

        let decoded = try JSONDecoder().decode(OpenMeteoResponse.self, from: data)

        let weather = WeatherData(
            temperature: Int(decoded.current.temperature_2m.rounded()),
            weatherCode: decoded.current.weather_code,
            isDay: decoded.current.is_day == 1
        )

        cachedWeather = weather
        lastFetchTime = Date()

        return weather
    }

    public func getWeeklyForecast(latitude: Double, longitude: Double) async throws -> [DailyForecast] {
        if let cached = cachedForecast,
           let lastFetch = lastForecastFetchTime,
           Date().timeIntervalSince(lastFetch) < cacheValiditySeconds {
            return cached
        }

        let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(latitude)&longitude=\(longitude)&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=auto")!

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw WeatherError.fetchFailed
        }

        let decoded = try JSONDecoder().decode(OpenMeteoForecastResponse.self, from: data)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.autoupdatingCurrent

        let count = min(
            decoded.daily.time.count,
            decoded.daily.temperature_2m_max.count,
            decoded.daily.temperature_2m_min.count,
            decoded.daily.weather_code.count
        )

        let forecast: [DailyForecast] = (0..<count).compactMap { index in
            guard let date = formatter.date(from: decoded.daily.time[index]) else { return nil }
            return DailyForecast(
                date: date,
                high: Int(decoded.daily.temperature_2m_max[index].rounded()),
                low: Int(decoded.daily.temperature_2m_min[index].rounded()),
                weatherCode: decoded.daily.weather_code[index]
            )
        }

        let trimmed = Array(forecast.prefix(7))
        cachedForecast = trimmed
        lastForecastFetchTime = Date()

        return trimmed
    }
}

public enum WeatherError: Error {
    case fetchFailed
    case locationUnavailable
}

private struct OpenMeteoResponse: Decodable {
    let current: CurrentWeather

    struct CurrentWeather: Decodable {
        let temperature_2m: Double
        let weather_code: Int
        let is_day: Int
    }
}

private struct OpenMeteoForecastResponse: Decodable {
    let daily: DailyForecastData

    struct DailyForecastData: Decodable {
        let time: [String]
        let temperature_2m_max: [Double]
        let temperature_2m_min: [Double]
        let weather_code: [Int]
    }
}

private func weatherIconForCode(_ code: Int, isDay: Bool) -> String {
    switch code {
    case 0: return isDay ? "sun.max.fill" : "moon.stars.fill"
    case 1, 2: return isDay ? "cloud.sun.fill" : "cloud.moon.fill"
    case 3: return "cloud.fill"
    case 45, 48: return "cloud.fog.fill"
    case 51, 53, 55, 61, 63, 65: return "cloud.rain.fill"
    case 66, 67: return "cloud.sleet.fill"
    case 71, 73, 75, 77, 85, 86: return "cloud.snow.fill"
    case 80, 81, 82: return "cloud.heavyrain.fill"
    case 95, 96, 99: return "cloud.bolt.rain.fill"
    default: return "thermometer.medium"
    }
}

private func weatherConditionForCode(_ code: Int) -> String {
    switch code {
    case 0: return "Clear"
    case 1: return "Mostly clear"
    case 2: return "Partly cloudy"
    case 3: return "Overcast"
    case 45, 48: return "Fog"
    case 51, 53, 55: return "Drizzle"
    case 61, 63, 65: return "Rain"
    case 66, 67: return "Freezing rain"
    case 71, 73, 75, 77: return "Snow"
    case 80, 81, 82: return "Showers"
    case 85, 86: return "Snow showers"
    case 95: return "Thunderstorm"
    case 96, 99: return "Thunderstorm"
    default: return "Weather"
    }
}
