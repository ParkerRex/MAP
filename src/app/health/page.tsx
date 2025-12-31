"use client";

import { Activity, Battery, Heart, Moon, RefreshCw, TrendingUp, Unlink, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatHrv,
  formatRecoveryScore,
  formatRestingHeartRate,
  formatSleepDuration,
  formatSleepPerformance,
  formatStrain,
  getRecoveryColor,
  getStrainColor,
  useWhoopCycles,
  useWhoopDisconnect,
  useWhoopProfile,
  useWhoopRecovery,
  useWhoopSleep,
  useWhoopSync,
  useWhoopWorkouts,
} from "@/hooks/use-whoop";
import { getSportName } from "@/lib/whoop-utils";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueClassName,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${valueClassName ?? ""}`}>{value}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-9 w-24" />
      <Skeleton className="mt-1 h-4 w-32" />
    </div>
  );
}

function formatDuration(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function SleepStageTooltip({
  label,
  duration,
  percentage,
}: {
  label: string;
  duration: number;
  percentage: number;
}) {
  return (
    <div className="text-center">
      <p className="font-medium">{label}</p>
      <p className="text-sm">{formatDuration(duration)}</p>
      <p className="text-xs text-muted-foreground">{Math.round(percentage)}% of sleep</p>
    </div>
  );
}

function SleepStagesBar({
  light,
  deep,
  rem,
  awake,
}: {
  light: number;
  deep: number;
  rem: number;
  awake: number;
}) {
  const total = light + deep + rem + awake;
  if (total === 0) return null;

  const lightPct = (light / total) * 100;
  const deepPct = (deep / total) * 100;
  const remPct = (rem / total) * 100;
  const awakePct = (awake / total) * 100;

  const stages = [
    { label: "Light Sleep", duration: light, percentage: lightPct, color: "bg-blue-300" },
    { label: "Deep Sleep", duration: deep, percentage: deepPct, color: "bg-blue-600" },
    { label: "REM Sleep", duration: rem, percentage: remPct, color: "bg-purple-500" },
    { label: "Awake", duration: awake, percentage: awakePct, color: "bg-gray-300" },
  ];

  return (
    <TooltipProvider>
      <div className="mt-4">
        <div className="flex h-3 overflow-hidden rounded-full">
          {stages.map((stage) =>
            stage.percentage > 0 ? (
              <Tooltip key={stage.label}>
                <TooltipTrigger asChild>
                  <div
                    className={`${stage.color} cursor-pointer transition-opacity hover:opacity-80`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <SleepStageTooltip
                    label={stage.label}
                    duration={stage.duration}
                    percentage={stage.percentage}
                  />
                </TooltipContent>
              </Tooltip>
            ) : null,
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {stages.map((stage) => (
            <Tooltip key={stage.label}>
              <TooltipTrigger asChild>
                <span className="flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-70">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  {stage.label.replace(" Sleep", "")} {Math.round(stage.percentage)}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <SleepStageTooltip
                  label={stage.label}
                  duration={stage.duration}
                  percentage={stage.percentage}
                />
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function WorkoutItem({
  sportName,
  strain,
  duration,
  date,
}: {
  sportName: string;
  strain: string;
  duration: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <div>
        <p className="font-medium">{sportName}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${getStrainColor(strain)}`}>{formatStrain(strain)}</p>
        <p className="text-sm text-muted-foreground">{duration}</p>
      </div>
    </div>
  );
}

function ConnectWhoopCard() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border bg-card p-8 text-center shadow-sm">
      <div className="rounded-full bg-primary/10 p-4">
        <Activity className="h-12 w-12 text-primary" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Connect Your WHOOP</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Connect your WHOOP account to see your recovery, strain, sleep, and workout data all in one
        place.
      </p>
      <Button asChild className="mt-6">
        <a href="/api/whoop/auth">Connect WHOOP</a>
      </Button>
    </div>
  );
}

type TimeRange = 7 | 30 | 90;

function HealthDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const { data: recovery, isLoading: isLoadingRecovery } = useWhoopRecovery();
  const { data: sleepData, isLoading: isLoadingSleep } = useWhoopSleep();
  const { data: workoutsData, isLoading: isLoadingWorkouts } = useWhoopWorkouts();
  const { data: cyclesData, isLoading: isLoadingCycles } = useWhoopCycles();
  const syncMutation = useWhoopSync();
  const disconnectMutation = useWhoopDisconnect();

  const latestRecovery = recovery?.latest;
  const latestCycle = recovery?.latestCycle;
  const latestSleep = sleepData?.latest;
  const workouts = workoutsData?.workouts ?? [];
  const cycles = cyclesData?.cycles ?? [];

  const isLoading = isLoadingRecovery || isLoadingSleep || isLoadingWorkouts || isLoadingCycles;

  // Calculate averages for selected time range
  const trendData = useMemo(() => {
    const rangeCycles = cycles.slice(0, timeRange);
    const rangeWorkouts = workouts.filter((w) => {
      const workoutDate = new Date(w.start);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      return workoutDate >= cutoffDate;
    });

    const avgStrain =
      rangeCycles.length > 0
        ? rangeCycles.reduce((acc, c) => acc + (parseFloat(c.strain ?? "0") || 0), 0) /
          rangeCycles.length
        : null;

    return {
      avgStrain,
      workoutCount: rangeWorkouts.length,
      daysTracked: rangeCycles.length,
    };
  }, [cycles, workouts, timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Health Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={disconnectMutation.isPending}>
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect WHOOP?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will disconnect your WHOOP account and delete all synced health data from
                  this app. Your data on WHOOP will not be affected. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => disconnectMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Today's Metrics */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Today</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingRecovery ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Recovery"
                value={formatRecoveryScore(latestRecovery?.recoveryScore)}
                subtitle="How ready you are to perform"
                icon={Battery}
                valueClassName={getRecoveryColor(latestRecovery?.recoveryScore)}
              />
              <MetricCard
                title="Strain"
                value={formatStrain(latestCycle?.strain)}
                subtitle="Cardiovascular load"
                icon={Zap}
                valueClassName={getStrainColor(latestCycle?.strain)}
              />
              <MetricCard
                title="HRV"
                value={formatHrv(latestRecovery?.hrvRmssd)}
                subtitle="Heart rate variability"
                icon={Heart}
              />
              <MetricCard
                title="Resting HR"
                value={formatRestingHeartRate(latestRecovery?.restingHeartRate)}
                subtitle="Resting heart rate"
                icon={Activity}
              />
            </>
          )}
        </div>
      </section>

      {/* Sleep Section */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Last Night's Sleep</h2>
        </div>
        {isLoadingSleep ? (
          <div className="mt-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : latestSleep ? (
          <div className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">
                  {formatSleepDuration(latestSleep.totalInBedTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">
                  {formatSleepPerformance(latestSleep.sleepPerformancePercentage)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">
                  {formatSleepPerformance(latestSleep.sleepEfficiencyPercentage)}
                </p>
              </div>
            </div>
            <SleepStagesBar
              light={latestSleep.totalLightSleepTime ?? 0}
              deep={latestSleep.totalSlowWaveSleepTime ?? 0}
              rem={latestSleep.totalRemSleepTime ?? 0}
              awake={latestSleep.totalAwakeTime ?? 0}
            />
            <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
              <span>Sleep cycles: {latestSleep.sleepCycleCount ?? "--"}</span>
              <span>Disturbances: {latestSleep.disturbanceCount ?? "--"}</span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">No sleep data available</p>
        )}
      </section>

      {/* Trend Section */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{timeRange}-Day Trend</h2>
          </div>
          <div className="flex rounded-md border">
            {([7, 30, 90] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm transition-colors ${
                  timeRange === range ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                } ${range === 7 ? "rounded-l-md" : ""} ${range === 90 ? "rounded-r-md" : ""}`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>
        {isLoadingCycles ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Avg Daily Strain</p>
              <p className="text-2xl font-bold">
                {trendData.avgStrain !== null ? trendData.avgStrain.toFixed(1) : "--"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Workouts</p>
              <p className="text-2xl font-bold">{trendData.workoutCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
              <p className="text-2xl font-bold">{trendData.daysTracked}</p>
            </div>
          </div>
        )}
      </section>

      {/* Recent Workouts */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        {isLoadingWorkouts ? (
          <div className="mt-4 space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : workouts.length > 0 ? (
          <div className="mt-4">
            {workouts.slice(0, 5).map((workout) => (
              <WorkoutItem
                key={workout.id}
                sportName={workout.sportName ?? getSportName(workout.sportId ?? 88)}
                strain={workout.strain ?? "0"}
                duration={formatSleepDuration(
                  workout.end && workout.start
                    ? new Date(workout.end).getTime() - new Date(workout.start).getTime()
                    : null,
                )}
                date={new Date(workout.start).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">No workouts recorded yet</p>
        )}
      </section>
    </div>
  );
}

function HealthPageContent() {
  const searchParams = useSearchParams();
  const { data: profileData, isLoading: isLoadingProfile } = useWhoopProfile();
  const syncMutation = useWhoopSync();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "connected") {
      // Auto-sync after successful connection
      syncMutation.mutate();
    }

    if (error) {
      console.error("WHOOP connection error:", error);
    }
  }, [searchParams, syncMutation]);

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {profileData?.connected ? <HealthDashboard /> : <ConnectWhoopCard />}
    </div>
  );
}

export default function HealthPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </div>
          </div>
        </div>
      }
    >
      <HealthPageContent />
    </Suspense>
  );
}
