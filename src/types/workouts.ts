export type WhoopWorkoutSnapshotIn = {
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
};
