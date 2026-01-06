"use client";

import {
  Activity,
  Dumbbell,
  Heart,
  Moon,
  RefreshCw,
  Sun,
  TrendingUp,
  Unlink,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
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
import type { AppleHealthSleepStages } from "@/lib/api";
import {
  calculateTrend,
  formatHoursMinutes,
  formatNumber,
  useAppleHealthSnapshot,
} from "@/hooks/use-apple-health";
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

function TrendBadge({ label, isPositive }: { label: string; isPositive: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"
      }`}
    >
      {label}
    </span>
  );
}

function DataSourceBadge({
  label,
  icon: Icon,
  connected,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-emerald-500" : "bg-orange-400"
        }`}
      />
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function SleepStageTooltipHours({
  label,
  hours,
  percentage,
}: {
  label: string;
  hours: number;
  percentage: number;
}) {
  return (
    <div className="text-center">
      <p className="font-medium">{label}</p>
      <p className="text-sm">{formatHoursMinutes(hours)}</p>
      <p className="text-xs text-muted-foreground">{Math.round(percentage)}% of sleep</p>
    </div>
  );
}

function AppleSleepStagesBar({ stages }: { stages: AppleHealthSleepStages }) {
  const total = stages.core + stages.deep + stages.rem;
  if (total <= 0) return null;

  const lightPct = (stages.core / total) * 100;
  const deepPct = (stages.deep / total) * 100;
  const remPct = (stages.rem / total) * 100;

  const segments = [
    { label: "Light", hours: stages.core, percentage: lightPct, color: "bg-cyan-400" },
    { label: "Deep", hours: stages.deep, percentage: deepPct, color: "bg-blue-500" },
    { label: "REM", hours: stages.rem, percentage: remPct, color: "bg-purple-500" },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted/50">
          {segments.map((segment) =>
            segment.percentage > 0 ? (
              <Tooltip key={segment.label}>
                <TooltipTrigger asChild>
                  <div
                    className={`${segment.color} cursor-pointer transition-opacity hover:opacity-80`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <SleepStageTooltipHours
                    label={`${segment.label} Sleep`}
                    hours={segment.hours}
                    percentage={segment.percentage}
                  />
                </TooltipContent>
              </Tooltip>
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {segments.map((segment) => (
            <span
              key={segment.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={`h-2 w-2 rounded-full ${segment.color}`} />
              {segment.label} {Math.round(segment.percentage)}%
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
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

type TimeRange = 7 | 30 | 90;

function HealthDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const appleSnapshotQuery = useAppleHealthSnapshot();
  const { data: appleSnapshot, isLoading: isLoadingApple } = appleSnapshotQuery;
  const { data: whoopProfile } = useWhoopProfile();
  const { data: recovery, isLoading: isLoadingRecovery } = useWhoopRecovery();
  const { data: sleepData, isLoading: isLoadingSleep } = useWhoopSleep();
  const { data: workoutsData, isLoading: isLoadingWorkouts } = useWhoopWorkouts();
  const { data: cyclesData, isLoading: isLoadingCycles } = useWhoopCycles();
  const syncMutation = useWhoopSync();
  const disconnectMutation = useWhoopDisconnect();

  const appleConnected = appleSnapshot?.connected ?? false;
  const appleLastSyncAt = appleSnapshot?.lastSyncAt ?? null;
  const appleToday = appleSnapshot?.snapshot?.today;
  const appleHistory = appleSnapshot?.snapshot?.history ?? [];
  const whoopConnected = whoopProfile?.connected ?? false;

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

  const appleTrends = useMemo(() => {
    const historyValues = {
      steps: appleHistory.map((day) => day.steps),
      activeEnergy: appleHistory.map((day) => day.activeEnergy),
      exerciseMinutes: appleHistory.map((day) => day.exerciseMinutes),
      standMinutes: appleHistory.map((day) => day.standMinutes),
      sleepHours: appleHistory.map((day) => day.sleepHours),
      restingHeartRate: appleHistory.map((day) => day.restingHeartRate),
      hrvSDNN: appleHistory.map((day) => day.hrvSDNN),
    };

    const recentSleep = appleHistory.slice(-7).map((day) => day.sleepHours ?? 0).filter((v) => v > 0);
    const recentSteps = appleHistory.slice(-7).map((day) => day.steps ?? 0).filter((v) => v > 0);

    return {
      stepsTrend: calculateTrend(appleToday?.steps, historyValues.steps),
      caloriesTrend: calculateTrend(appleToday?.activeEnergy, historyValues.activeEnergy),
      exerciseTrend: calculateTrend(appleToday?.exerciseMinutes, historyValues.exerciseMinutes),
      standTrend: calculateTrend(appleToday?.standMinutes, historyValues.standMinutes),
      sleepTrend: calculateTrend(appleToday?.sleepHours, historyValues.sleepHours),
      restingHrTrend: calculateTrend(
        appleToday?.restingHeartRate,
        historyValues.restingHeartRate,
        false,
      ),
      hrvTrend: calculateTrend(appleToday?.hrvSDNN, historyValues.hrvSDNN),
      sleepAverage7d:
        recentSleep.length > 0
          ? recentSleep.reduce((sum, value) => sum + value, 0) / recentSleep.length
          : null,
      stepsAverage7d:
        recentSteps.length > 0
          ? recentSteps.reduce((sum, value) => sum + value, 0) / recentSteps.length
          : null,
    };
  }, [appleHistory, appleToday]);

  const appleHasData = useMemo(() => {
    if (!appleToday) return false;
    return [
      appleToday.steps,
      appleToday.activeEnergy,
      appleToday.exerciseMinutes,
      appleToday.standMinutes,
      appleToday.sleepHours,
      appleToday.restingHeartRate,
      appleToday.hrvSDNN,
    ].some((value) => typeof value === "number" && value > 0);
  }, [appleToday]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-sm text-muted-foreground">
            Your daily health metrics from Apple Health and WHOOP
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DataSourceBadge label="Apple Health" icon={Heart} connected={appleConnected} />
            <DataSourceBadge label="WHOOP" icon={Zap} connected={whoopConnected} />
          </div>
          {appleLastSyncAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(appleLastSyncAt), { addSuffix: true })}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => appleSnapshotQuery.refetch()}
            disabled={isLoadingApple}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingApple ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={!whoopConnected || syncMutation.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!whoopConnected || disconnectMutation.isPending}>
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

      {/* Apple Health */}
      {isLoadingApple ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32" />
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      ) : !appleConnected || !appleHasData ? (
        <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Connect Apple Health</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the iOS app and grant HealthKit access to sync steps, sleep, heart rate, and more
            to the web dashboard.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Today</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <MetricTile
                label="Steps"
                value={formatNumber(appleToday?.steps)}
                icon={Activity}
              />
              <MetricTile
                label="Calories"
                value={formatNumber(appleToday?.activeEnergy, " kcal", 0)}
                icon={Zap}
              />
              <MetricTile
                label="Exercise"
                value={formatNumber(appleToday?.exerciseMinutes, " min", 0)}
                icon={Dumbbell}
              />
              <MetricTile
                label="Stand"
                value={formatNumber(
                  appleToday?.standMinutes ? appleToday.standMinutes / 60 : null,
                  " hr",
                  1,
                )}
                icon={Activity}
              />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Sleep</p>
                  </div>
                  {appleTrends.sleepTrend ? (
                    <TrendBadge
                      label={appleTrends.sleepTrend.label}
                      isPositive={appleTrends.sleepTrend.isPositive}
                    />
                  ) : null}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {formatHoursMinutes(appleToday?.sleepHours)}
                  </p>
                  {appleTrends.sleepAverage7d ? (
                    <span className="text-xs text-muted-foreground">
                      avg {formatHoursMinutes(appleTrends.sleepAverage7d)}
                    </span>
                  ) : null}
                </div>
                {appleToday?.sleepStages ? (
                  <div className="mt-4">
                    <AppleSleepStagesBar stages={appleToday.sleepStages} />
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Heart</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Resting HR</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(appleToday?.restingHeartRate, " bpm", 0)}
                    </p>
                    {appleTrends.restingHrTrend ? (
                      <TrendBadge
                        label={appleTrends.restingHrTrend.label}
                        isPositive={appleTrends.restingHrTrend.isPositive}
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">HRV</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(appleToday?.hrvSDNN, " ms", 0)}
                    </p>
                    {appleTrends.hrvTrend ? (
                      <TrendBadge
                        label={appleTrends.hrvTrend.label}
                        isPositive={appleTrends.hrvTrend.isPositive}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Activity</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <MetricTile
                label="Steps"
                value={formatNumber(appleToday?.steps)}
                icon={Activity}
              />
              <MetricTile
                label="Calories"
                value={formatNumber(appleToday?.activeEnergy, " kcal", 0)}
                icon={Zap}
              />
              <MetricTile
                label="Exercise"
                value={formatNumber(appleToday?.exerciseMinutes, " min", 0)}
                icon={Dumbbell}
              />
              <MetricTile
                label="Stand"
                value={formatNumber(
                  appleToday?.standMinutes ? appleToday.standMinutes / 60 : null,
                  " hr",
                  1,
                )}
                icon={Activity}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {appleTrends.stepsTrend ? (
                <TrendBadge
                  label={`Steps ${appleTrends.stepsTrend.label}`}
                  isPositive={appleTrends.stepsTrend.isPositive}
                />
              ) : null}
              {appleTrends.caloriesTrend ? (
                <TrendBadge
                  label={`Calories ${appleTrends.caloriesTrend.label}`}
                  isPositive={appleTrends.caloriesTrend.isPositive}
                />
              ) : null}
              {appleTrends.exerciseTrend ? (
                <TrendBadge
                  label={`Exercise ${appleTrends.exerciseTrend.label}`}
                  isPositive={appleTrends.exerciseTrend.isPositive}
                />
              ) : null}
              {appleTrends.standTrend ? (
                <TrendBadge
                  label={`Stand ${appleTrends.standTrend.label}`}
                  isPositive={appleTrends.standTrend.isPositive}
                />
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* WHOOP */}
      {!whoopConnected ? (
        <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Connect WHOOP</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Link your WHOOP account to see recovery, strain, sleep, and workouts alongside your
            Apple Health data.
          </p>
          <Button asChild size="sm" className="mt-4">
            <a href="/api/whoop/auth">Connect WHOOP</a>
          </Button>
        </div>
      ) : (
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
      )}

      {whoopConnected ? (
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
      ) : null}

      {whoopConnected ? (
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
      ) : null}

      {whoopConnected ? (
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
      ) : null}
    </div>
  );
}

function HealthPageContent() {
  const searchParams = useSearchParams();
  const { isLoading: isLoadingProfile } = useWhoopProfile();
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

  return <HealthDashboard />;
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
