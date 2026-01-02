import CoreLocation
import Foundation

public struct WeatherData {
    public let temperature: Int
    public let weatherCode: Int
    public let isDay: Bool

    public var icon: String {
        Self.iconForCode(weatherCode, isDay: isDay)
    }

    private static func iconForCode(_ code: Int, isDay: Bool) -> String {
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
}

public actor WeatherService {
    public static let shared = WeatherService()

    private var cachedWeather: WeatherData?
    private var lastFetchTime: Date?
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
