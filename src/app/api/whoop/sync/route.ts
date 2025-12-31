import { NextResponse } from "next/server";
import { whoopDb } from "@/db/whoop";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import {
  getWhoopClientForUser,
  type WhoopCycle,
  type WhoopRecovery,
  type WhoopSleep,
  type WhoopWorkout,
} from "@/lib/whoop";

// Sync all WHOOP data for the user
export async function POST() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const client = await getWhoopClientForUser(user.id);

    // Sync profile and body measurements
    const [profile, bodyMeasurement] = await Promise.all([
      client.getProfile(),
      client.getBodyMeasurement(),
    ]);

    await whoopDb.upsertProfile({
      userId: user.id,
      whoopUserId: profile.user_id.toString(),
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      heightMeter: bodyMeasurement.height_meter?.toString(),
      weightKilogram: bodyMeasurement.weight_kilogram?.toString(),
      maxHeartRate: bodyMeasurement.max_heart_rate,
      lastSyncedAt: new Date(),
    });

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // Sync cycles, recovery, sleep, and workouts in parallel
    const [cyclesResponse, recoveriesResponse, sleepsResponse, workoutsResponse] =
      await Promise.all([
        client.getCycles({ start: startIso, end: endIso, limit: 50 }),
        client.getRecoveries({ start: startIso, end: endIso, limit: 50 }),
        client.getSleeps({ start: startIso, end: endIso, limit: 50 }),
        client.getWorkouts({ start: startIso, end: endIso, limit: 50 }),
      ]);

    // Process cycles
    const cyclePromises = cyclesResponse.records.map((cycle: WhoopCycle) =>
      whoopDb.upsertCycle({
        id: cycle.id.toString(),
        userId: user.id,
        whoopUserId: cycle.user_id.toString(),
        start: new Date(cycle.start),
        end: cycle.end ? new Date(cycle.end) : null,
        timezoneOffset: cycle.timezone_offset,
        scoreState: cycle.score_state,
        strain: cycle.score?.strain?.toString(),
        kilojoule: cycle.score?.kilojoule?.toString(),
        averageHeartRate: cycle.score?.average_heart_rate,
        maxHeartRate: cycle.score?.max_heart_rate,
      }),
    );
    await Promise.all(cyclePromises);

    // Process recoveries
    const recoveryPromises = recoveriesResponse.records.map((recovery: WhoopRecovery) =>
      whoopDb.upsertRecovery({
        cycleId: recovery.cycle_id.toString(),
        sleepId: recovery.sleep_id,
        userId: user.id,
        whoopUserId: recovery.user_id.toString(),
        scoreState: recovery.score_state,
        recoveryScore: recovery.score?.recovery_score,
        restingHeartRate: recovery.score?.resting_heart_rate?.toString(),
        hrvRmssd: recovery.score?.hrv_rmssd_milli?.toString(),
        spo2Percentage: recovery.score?.spo2_percentage?.toString(),
        skinTempCelsius: recovery.score?.skin_temp_celsius?.toString(),
      }),
    );
    await Promise.all(recoveryPromises);

    // Process sleeps
    const sleepPromises = sleepsResponse.records.map((sleep: WhoopSleep) =>
      whoopDb.upsertSleep({
        id: sleep.id,
        userId: user.id,
        whoopUserId: sleep.user_id.toString(),
        start: new Date(sleep.start),
        end: sleep.end ? new Date(sleep.end) : null,
        timezoneOffset: sleep.timezone_offset,
        isNap: sleep.nap,
        scoreState: sleep.score_state,
        totalInBedTime: sleep.score?.stage_summary?.total_in_bed_time_milli,
        totalAwakeTime: sleep.score?.stage_summary?.total_awake_time_milli,
        totalNoDataTime: sleep.score?.stage_summary?.total_no_data_time_milli,
        totalLightSleepTime: sleep.score?.stage_summary?.total_light_sleep_time_milli,
        totalSlowWaveSleepTime: sleep.score?.stage_summary?.total_slow_wave_sleep_time_milli,
        totalRemSleepTime: sleep.score?.stage_summary?.total_rem_sleep_time_milli,
        sleepCycleCount: sleep.score?.stage_summary?.sleep_cycle_count,
        disturbanceCount: sleep.score?.stage_summary?.disturbance_count,
        sleepNeeded: sleep.score?.sleep_needed
          ? sleep.score.sleep_needed.baseline_milli +
            sleep.score.sleep_needed.need_from_sleep_debt_milli +
            sleep.score.sleep_needed.need_from_recent_strain_milli -
            sleep.score.sleep_needed.need_from_recent_nap_milli
          : null,
        respiratoryRate: sleep.score?.respiratory_rate?.toString(),
        sleepPerformancePercentage: sleep.score?.sleep_performance_percentage?.toString(),
        sleepConsistencyPercentage: sleep.score?.sleep_consistency_percentage?.toString(),
        sleepEfficiencyPercentage: sleep.score?.sleep_efficiency_percentage?.toString(),
      }),
    );
    await Promise.all(sleepPromises);

    // Process workouts
    const workoutPromises = workoutsResponse.records.map((workout: WhoopWorkout) =>
      whoopDb.upsertWorkout({
        id: workout.id,
        userId: user.id,
        whoopUserId: workout.user_id.toString(),
        start: new Date(workout.start),
        end: workout.end ? new Date(workout.end) : null,
        timezoneOffset: workout.timezone_offset,
        sportId: workout.sport_id,
        scoreState: workout.score_state,
        strain: workout.score?.strain?.toString(),
        averageHeartRate: workout.score?.average_heart_rate,
        maxHeartRate: workout.score?.max_heart_rate,
        kilojoule: workout.score?.kilojoule?.toString(),
        distanceMeters: workout.score?.distance_meter?.toString(),
        altitudeGainMeters: workout.score?.altitude_gain_meter?.toString(),
        zoneZeroMs: workout.score?.zone_duration?.zone_zero_milli,
        zoneOneMs: workout.score?.zone_duration?.zone_one_milli,
        zoneTwoMs: workout.score?.zone_duration?.zone_two_milli,
        zoneThreeMs: workout.score?.zone_duration?.zone_three_milli,
        zoneFourMs: workout.score?.zone_duration?.zone_four_milli,
        zoneFiveMs: workout.score?.zone_duration?.zone_five_milli,
      }),
    );
    await Promise.all(workoutPromises);

    return NextResponse.json({
      success: true,
      synced: {
        cycles: cyclesResponse.records.length,
        recoveries: recoveriesResponse.records.length,
        sleeps: sleepsResponse.records.length,
        workouts: workoutsResponse.records.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
