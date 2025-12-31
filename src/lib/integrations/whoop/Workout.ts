import type { WhoopWorkoutSnapshotIn } from '@/types/workouts';

export const MAX_STRAIN = 21;

export class WhoopWorkout {
  public readonly id: string;
  private readonly snapshot: WhoopWorkoutSnapshotIn;
  private start: Date;
  private end: Date;

  constructor(snapshot: WhoopWorkoutSnapshotIn) {
    this.snapshot = snapshot;
    this.id = snapshot.id;
    this.start = new Date(this.snapshot.start);
    this.end = new Date(this.snapshot.end);
  }
  get activityName() {
    return getSportName(this.snapshot.sport_id);
  }

  get startTime() {
    return new Date(this.snapshot.start).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  get endTime() {
    return new Date(this.snapshot.end).toLocaleTimeString();
  }

  get strain() {
    return this.snapshot.score?.strain || 0;
  }

  get strainPercentage() {
    return Math.round((this.strain / MAX_STRAIN) * 100);
  }

  get avgHeartRate() {
    return this.snapshot.score?.average_heart_rate || 0;
  }

  get maxHeartRate() {
    return this.snapshot.score?.max_heart_rate || 0;
  }

  get calories() {
    return this.snapshot.score?.kilojoule || 0;
  }

  get distance() {
    return this.snapshot.score?.distance_meter || 0;
  }

  get startDay() {
    return this.snapshot.start.split('T')[0];
  }

  get duration() {
    return this.end.valueOf() - this.start.valueOf();
  }

  get durationMinutes() {
    return this.duration / (60 * 1000);
  }

  isAfter(date: Date): boolean {
    return this.start >= date;
  }

  toJournalEntry(): string {
    let entry = `
      On: ${this.startDay}
      I performed a ${this.activityName} fitness activity for ${this.durationMinutes} minutes
      My max heart rate was ${this.maxHeartRate}bpm
      My average heart rate was ${this.avgHeartRate}bpm
      I burned ${this.calories} calories
    `;
    if (this.distance > 0) {
      entry += `
        I covered ${this.distance} meters during this activity
        My pace was ${
          this.distance / (this.durationMinutes >= 0 ? this.durationMinutes : 1)
        } meters per minute
      `;
    }
    return entry;
  }
}

function getSportName(sportId: number): string {
  switch (sportId) {
    case -1:
      return 'Activity';
    case 0:
      return 'Running';
    case 1:
      return 'Cycling';
    case 16:
      return 'Baseball';
    case 17:
      return 'Basketball';
    case 18:
      return 'Rowing';
    case 19:
      return 'Fencing';
    case 20:
      return 'Field Hockey';
    case 21:
      return 'Football';
    case 22:
      return 'Golf';
    case 24:
      return 'Ice Hockey';
    case 25:
      return 'Lacrosse';
    case 27:
      return 'Rugby';
    case 28:
      return 'Sailing';
    case 29:
      return 'Skiing';
    case 30:
      return 'Soccer';
    case 31:
      return 'Softball';
    case 32:
      return 'Squash';
    case 33:
      return 'Swimming';
    case 34:
      return 'Tennis';
    case 35:
      return 'Track & Field';
    case 36:
      return 'Volleyball';
    case 37:
      return 'Water Polo';
    case 38:
      return 'Wrestling';
    case 39:
      return 'Boxing';
    case 42:
      return 'Dance';
    case 43:
      return 'Pilates';
    case 44:
      return 'Yoga';
    case 45:
      return 'Weightlifting';
    case 47:
      return 'Cross Country Skiing';
    case 48:
      return 'Functional Fitness';
    case 49:
      return 'Duathlon';
    case 51:
      return 'Gymnastics';
    case 52:
      return 'Hiking/Rucking';
    case 53:
      return 'Horseback Riding';
    case 55:
      return 'Kayaking';
    case 56:
      return 'Martial Arts';
    case 57:
      return 'Mountain Biking';
    case 59:
      return 'Powerlifting';
    case 60:
      return 'Rock Climbing';
    case 61:
      return 'Paddleboarding';
    case 62:
      return 'Triathlon';
    case 63:
      return 'Walking';
    case 64:
      return 'Surfing';
    case 65:
      return 'Elliptical';
    case 66:
      return 'Stairmaster';
    case 70:
      return 'Meditation';
    case 71:
      return 'Other';
    case 73:
      return 'Diving';
    case 74:
      return 'Operations - Tactical';
    case 75:
      return 'Operations - Medical';
    case 76:
      return 'Operations - Flying';
    case 77:
      return 'Operations - Water';
    case 82:
      return 'Ultimate';
    case 83:
      return 'Climber';
    case 84:
      return 'Jumping Rope';
    case 85:
      return 'Australian Football';
    case 86:
      return 'Skateboarding';
    case 87:
      return 'Coaching';
    case 88:
      return 'Ice Bath';
    case 89:
      return 'Commuting';
    case 90:
      return 'Gaming';
    case 91:
      return 'Snowboarding';
    case 92:
      return 'Motocross';
    case 93:
      return 'Caddying';
    case 94:
      return 'Obstacle Course Racing';
    case 95:
      return 'Motor Racing';
    case 96:
      return 'HIIT';
    case 97:
      return 'Spin';
    case 98:
      return 'Jiu Jitsu';
    case 99:
      return 'Manual Labor';
    case 100:
      return 'Cricket';
    case 101:
      return 'Pickleball';
    case 102:
      return 'Inline Skating';
    case 103:
      return 'Box Fitness';
    case 104:
      return 'Spikeball';
    case 105:
      return 'Wheelchair Pushing';
    case 106:
      return 'Paddle Tennis';
    case 107:
      return 'Barre';
    case 108:
      return 'Stage Performance';
    case 109:
      return 'High Stress Work';
    case 110:
      return 'Parkour';
    case 111:
      return 'Gaelic Football';
    case 112:
      return 'Hurling/Camogie';
    case 113:
      return 'Circus Arts';
    case 121:
      return 'Massage Therapy';
    case 125:
      return 'Watching Sports';
    case 126:
      return 'Assault Bike';
    case 127:
      return 'Kickboxing';
    case 128:
      return 'Stretching';
    case 230:
      return 'Table Tennis';
    case 231:
      return 'Badminton';
    case 232:
      return 'Netball';
    case 233:
      return 'Sauna';
    case 234:
      return 'Disc Golf';
    case 235:
      return 'Yard Work';
    case 236:
      return 'Air Compression';
    case 237:
      return 'Percussive Massage';
    case 238:
      return 'Paintball';
    case 239:
      return 'Ice Skating';
    case 240:
      return 'Handball';
    default:
      return 'Unknown Sport';
  }
}
