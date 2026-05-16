import { getEffectiveWindow } from "./timeWindow";

type LeaderboardFilters = {
  metric?: string;
  timeWindow?: string;
  subjectIds?: string[];
  sortBy?: string;
  sort?: string;
  offset?: number;
  limit?: number;
  viewerId?: string;
};

type GoalWindow = {
  goalType: "deadline" | "recurring";
  deadline?: Date | null;
  startDate?: Date;
  frequency?: "daily" | "weekly" | "monthly" | null;
};

type RedisSetClient = {
  smembers: (key: string) => Promise<string[]>;
  del: (...keys: string[]) => Promise<number>;
};

//sort field mapping
export function resolveSortField(sortBy: string) {
  const map: Record<string, string> = {
    questionsSolved: "questionsSolved",
    percentage: "percentage",
    timeSpent: "timeSpent",
    userName: "name",
  };
  return map[sortBy] ?? "questionsSolved";
}

//rank is based on questions solved or time spent (for tie-breaking)
export function resolveRankField(metric: string) {
  if (metric === "timeSpent") {
    return "timeSpent";
  }
  if (metric === "percentage") {
    return "percentage";
  }
  return "questionsSolved";
}

export function buildCacheKey(goalId: string, filters: LeaderboardFilters) {
  const {
    metric,
    timeWindow,
    subjectIds = [],
    sortBy,
    sort,
    offset,
    limit,
    viewerId,
  } = filters;
  const subjectStr = [...subjectIds].sort().join(",");
  const viewerKey = viewerId ?? "anon";
  return `leaderboard:${goalId}:${metric}:${timeWindow}:${subjectStr}:${sortBy}:${sort}:${offset}:${limit}:${viewerKey}`;
}

export function resolveCacheTTL(goal: GoalWindow) {
  const MAX_TTL = 300; // 5 minutes
  let periodEnd;

  if (goal.goalType === "deadline") {
    periodEnd = new Date(goal.deadline ?? Date.now());
  } else {
    const { windowEnd } = getEffectiveWindow(goal);
    periodEnd = windowEnd;
  }

  const secondsLeft = Math.floor((periodEnd - Date.now()) / 1000);
  return Math.min(Math.max(secondsLeft, 0), MAX_TTL);
}

export async function invalidateGoalCache(
  redis: RedisSetClient,
  goalId: string,
) {
  const setKey = `leaderboard:keys:${goalId}`;
  const keys = await redis.smembers(setKey);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.del(setKey);
}

