"use client";

import { Activity, Dumbbell, Heart, Moon, RefreshCw, TrendingUp, Unlink, Zap } from "lucide-react";
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

// Recovery ring component
function RecoveryRing({
  score,
  size = 160,
  strokeWidth = 12,
}: {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getGradientId = () => {
    if (normalizedScore >= 67) return "gradient-green";
    if (normalizedScore >= 34) return "gradient-yellow";
    return "gradient-red";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <defs>
          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getRecoveryColor(score)}`}>
          {score ?? "--"}
          {score !== null && score !== undefined && <span className="text-xl font-medium">%</span>}
        </span>
        <span className="text-xs text-muted-foreground">Recovery</span>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold ${valueClassName ?? ""}`}>{value}</p>
      </div>
    </div>
  );
}

function MetricPillSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div>
        <Skeleton className="h-3 w-12 mb-1" />
        <Skeleton className="h-5 w-16" />
      </div>
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

const stageColors = {
  light: { bg: "bg-blue-400", text: "text-blue-400" },
  deep: { bg: "bg-indigo-500", text: "text-indigo-500" },
  rem: { bg: "bg-purple-500", text: "text-purple-500" },
  awake: { bg: "bg-slate-300 dark:bg-slate-600", text: "text-slate-400" },
};

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
    { label: "Light", duration: light, percentage: lightPct, color: stageColors.light },
    { label: "Deep", duration: deep, percentage: deepPct, color: stageColors.deep },
    { label: "REM", duration: rem, percentage: remPct, color: stageColors.rem },
    { label: "Awake", duration: awake, percentage: awakePct, color: stageColors.awake },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/50">
          {stages.map((stage) =>
            stage.percentage > 0 ? (
              <Tooltip key={stage.label}>
                <TooltipTrigger asChild>
                  <div
                    className={`${stage.color.bg} cursor-pointer transition-opacity hover:opacity-80`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <SleepStageTooltip
                    label={`${stage.label} Sleep`}
                    duration={stage.duration}
                    percentage={stage.percentage}
                  />
                </TooltipContent>
              </Tooltip>
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {stages.map((stage) => (
            <span
              key={stage.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={`h-2 w-2 rounded-full ${stage.color.bg}`} />
              {stage.label} {Math.round(stage.percentage)}%
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function WorkoutCard({
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
  const strainValue = parseFloat(strain) || 0;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <Dumbbell className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{sportName}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${getStrainColor(strain)}`}>{formatStrain(strain)}</p>
        <p className="text-xs text-muted-foreground">{duration}</p>
      </div>
      <div className="w-12">
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              strainValue >= 18
                ? "bg-red-500"
                : strainValue >= 14
                  ? "bg-orange-500"
                  : strainValue >= 10
                    ? "bg-yellow-500"
                    : "bg-blue-500"
            }`}
            style={{ width: `${Math.min((strainValue / 21) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ConnectWhoopCard() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-primary/10 p-6">
        <Activity className="h-16 w-16 text-primary" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">Connect Your WHOOP</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        Unlock insights about your recovery, strain, sleep, and workouts. Connect your WHOOP to see
        all your health data in one place.
      </p>
      <Button asChild size="lg" className="mt-8">
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
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-sm text-muted-foreground">Your daily health metrics from WHOOP</p>
        </div>
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
              <Button variant="ghost" size="sm" disabled={disconnectMutation.isPending}>
                <Unlink className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect WHOOP?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will disconnect your WHOOP account and delete all synced health data from
                  this app. Your data on WHOOP will not be affected.
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

      {/* Hero Recovery Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {isLoadingRecovery ? (
            <Skeleton className="h-40 w-40 rounded-full" />
          ) : (
            <RecoveryRing score={latestRecovery?.recoveryScore} />
          )}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Today's Readiness</h2>
              <p className="text-sm text-muted-foreground">
                {latestRecovery?.recoveryScore !== undefined &&
                latestRecovery?.recoveryScore !== null
                  ? latestRecovery.recoveryScore >= 67
                    ? "You're primed to take on strain today"
                    : latestRecovery.recoveryScore >= 34
                      ? "Moderate activity is recommended"
                      : "Consider prioritizing rest and recovery"
                  : "Sync your WHOOP to see today's readiness"}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {isLoadingRecovery ? (
                <>
                  <MetricPillSkeleton />
                  <MetricPillSkeleton />
                  <MetricPillSkeleton />
                </>
              ) : (
                <>
                  <MetricPill
                    label="Strain"
                    value={formatStrain(latestCycle?.strain)}
                    icon={Zap}
                    valueClassName={getStrainColor(latestCycle?.strain)}
                  />
                  <MetricPill
                    label="HRV"
                    value={formatHrv(latestRecovery?.hrvRmssd)}
                    icon={Heart}
                  />
                  <MetricPill
                    label="Resting HR"
                    value={formatRestingHeartRate(latestRecovery?.restingHeartRate)}
                    icon={Activity}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sleep Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Last Night's Sleep</h2>
          </div>
          {latestSleep && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {formatSleepPerformance(latestSleep.sleepPerformancePercentage)} performance
            </span>
          )}
        </div>
        {isLoadingSleep ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ) : latestSleep ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">
                  {formatSleepDuration(latestSleep.totalInBedTime)}
                </p>
                <p className="text-xs text-muted-foreground">Time in bed</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">
                  {formatSleepPerformance(latestSleep.sleepEfficiencyPercentage)}
                </p>
                <p className="text-xs text-muted-foreground">Efficiency</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">{latestSleep.sleepCycleCount ?? "--"}</p>
                <p className="text-xs text-muted-foreground">Sleep cycles</p>
              </div>
            </div>
            <SleepStagesBar
              light={latestSleep.totalLightSleepTime ?? 0}
              deep={latestSleep.totalSlowWaveSleepTime ?? 0}
              rem={latestSleep.totalRemSleepTime ?? 0}
              awake={latestSleep.totalAwakeTime ?? 0}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center py-8 text-center">
            <Moon className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No sleep data available</p>
          </div>
        )}
      </div>

      {/* Trends Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Trends</h2>
          </div>
          <div className="flex rounded-lg border p-0.5">
            {([7, 30, 90] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>
        {isLoadingCycles ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Avg Daily Strain</p>
              <p className="mt-1 text-2xl font-bold">
                {trendData.avgStrain !== null ? trendData.avgStrain.toFixed(1) : "--"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Workouts</p>
              <p className="mt-1 text-2xl font-bold">{trendData.workoutCount}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Days Tracked</p>
              <p className="mt-1 text-2xl font-bold">{trendData.daysTracked}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        {isLoadingWorkouts ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : workouts.length > 0 ? (
          <div className="mt-4 space-y-3">
            {workouts.slice(0, 5).map((workout) => (
              <WorkoutCard
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
          <div className="mt-6 flex flex-col items-center py-8 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No workouts recorded yet</p>
          </div>
        )}
      </div>
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
      syncMutation.mutate();
    }

    if (error) {
      console.error("WHOOP connection error:", error);
    }
  }, [searchParams, syncMutation]);

  if (isLoadingProfile) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return profileData?.connected ? <HealthDashboard /> : <ConnectWhoopCard />;
}

export default function HealthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-1 h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      }
    >
      <HealthPageContent />
    </Suspense>
  );
}
