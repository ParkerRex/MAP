import Foundation

extension HealthDataFetcher {
    /// Fetches and processes health data for the last 14 days.
    public func fetchAndProcessHealthData() async -> [HealthData] {
        let calendar = Calendar.current
        let today = Date()
        var healthData: [HealthData] = []

        // Create an array of HealthData objects for the last 14 days
        for day in 1...14 {
            guard let endDate = calendar.date(byAdding: .day, value: -day, to: today) else { continue }
            healthData.append(
                HealthData(date: DateFormatter.localizedString(from: endDate, dateStyle: .short, timeStyle: .none))
            )
        }

        healthData = healthData.reversed()

        // Fetch all metrics concurrently
        async let stepCounts = try? fetchLastTwoWeeksStepCount()
        async let activeEnergy = try? fetchLastTwoWeeksActiveEnergy()
        async let basalEnergy = try? fetchLastTwoWeeksBasalEnergy()
        async let exerciseTime = try? fetchLastTwoWeeksExerciseTime()
        async let standTime = try? fetchLastTwoWeeksStandTime()
        async let distance = try? fetchLastTwoWeeksDistance()
        async let flights = try? fetchLastTwoWeeksFlightsClimbed()

        async let restingHR = try? fetchLastTwoWeeksRestingHeartRate()
        async let hrv = try? fetchLastTwoWeeksHRV()
        async let walkingHR = try? fetchLastTwoWeeksWalkingHeartRate()
        async let vo2max = try? fetchLastTwoWeeksVO2Max()
        async let spo2 = try? fetchLastTwoWeeksOxygenSaturation()
        async let respRate = try? fetchLastTwoWeeksRespiratoryRate()

        async let bodyMass = try? fetchLastTwoWeeksBodyWeight()
        async let bodyFat = try? fetchLastTwoWeeksBodyFat()
        async let leanMass = try? fetchLastTwoWeeksLeanBodyMass()

        async let sleepHours = try? fetchLastTwoWeeksSleep()
        async let sleepStages = try? fetchLastTwoWeeksSleepStages()

        // Await all results
        let steps = await stepCounts
        let active = await activeEnergy
        let basal = await basalEnergy
        let exercise = await exerciseTime
        let stand = await standTime
        let dist = await distance
        let flightsClimbed = await flights

        let rhr = await restingHR
        let hrvData = await hrv
        let whr = await walkingHR
        let vo2 = await vo2max
        let oxygen = await spo2
        let respiratory = await respRate

        let weight = await bodyMass
        let fat = await bodyFat
        let lean = await leanMass

        let sleep = await sleepHours
        let stages = await sleepStages

        // Populate health data
        for day in 0...13 {
            // Activity
            healthData[day].steps = steps?[day]
            healthData[day].activeEnergy = active?[day]
            healthData[day].basalEnergy = basal?[day]
            healthData[day].exerciseMinutes = exercise?[day]
            healthData[day].standMinutes = stand?[day]
            healthData[day].distanceMiles = dist?[day]
            healthData[day].flightsClimbed = flightsClimbed?[day]

            // Heart & Recovery
            healthData[day].restingHeartRate = rhr?[day]
            healthData[day].hrvSDNN = hrvData?[day]
            healthData[day].walkingHeartRate = whr?[day]
            healthData[day].vo2Max = vo2?[day]
            healthData[day].oxygenSaturation = oxygen?[day]
            healthData[day].respiratoryRate = respiratory?[day]

            // Body
            healthData[day].bodyWeight = weight?[day]
            healthData[day].bodyFatPercentage = fat?[day]
            healthData[day].leanBodyMass = lean?[day]

            // Sleep
            healthData[day].sleepHours = sleep?[day]
            if let stageData = stages?[day], !stageData.isEmpty {
                healthData[day].sleepStages = SleepStages(
                    awake: stageData["awake"] ?? 0,
                    rem: stageData["rem"] ?? 0,
                    core: stageData["core"] ?? 0,
                    deep: stageData["deep"] ?? 0,
                    inBed: stageData["inBed"] ?? 0
                )
            }
        }

        return healthData
    }
}
