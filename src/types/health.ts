export interface HeartRateData {
  date: string;
  averageHeartRate: number;
}

export interface SleepStageSummary {
  total_rem_sleep_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_awake_time_milli: number;
}

export interface SleepData {
  id: number;
  start: string;
  end: string;
  score: {
    stage_summary: SleepStageSummary;
    recovery_score: number;
  };
}

export interface WorkoutData {
  id: string;
  start: string;
  end: string;
  sport_id: number;
  score: {
    average_heart_rate: number;
    max_heart_rate: number;
    strain: number;
    kilojoule: number;
    distance_meter: number;
  };
}
