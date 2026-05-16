//@ts-ignore

export function getEffectiveWindow(goal) {
  if (goal.goalType === "deadline") {
    return {
      windowStart: goal.startDate,
      windowEnd: goal.deadline,
    };
  }
  // recurring goal
  const now = new Date();
  const start = new Date(goal.startDate);

  if (goal.frequency === "daily") {
    const dayMs = 86400000;
    const periods = Math.floor((now.getTime() - start.getTime()) / dayMs);
    const windowStart = new Date(start.getTime() + periods * dayMs);
    return {
      windowStart,
      windowEnd: new Date(windowStart.getTime() + dayMs),
    };
  }

  if (goal.frequency === "weekly") {
    const weekMs = 7 * 86400000;
    const periods = Math.floor((now.getTime() - start.getTime()) / weekMs);
    const windowStart = new Date(start.getTime() + periods * weekMs);
    return {
      windowStart,
      windowEnd: new Date(windowStart.getTime() + weekMs),
    };
  }

  if (goal.frequency === "monthly") {
    // Can't use fixed ms — months have different lengths
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      start.getDate(),
    );
    if (monthStart > now) monthStart.setMonth(monthStart.getMonth() - 1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    return { windowStart: monthStart, windowEnd: monthEnd };
  }
  throw new Error("Invalid goal frequency");
}

//@ts-ignore
export function resolveDateRange(timeWindow, goal) {
  const now = new Date();

  if (timeWindow === "all") {
    // Respects goal's own window (deadline or current recurring period)
    const { windowStart, windowEnd } = getEffectiveWindow(goal);
    return { from: windowStart, to: windowEnd };
  }

  if (timeWindow === "day" || timeWindow === "daily") {
    const from = new Date(now);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to };
  }

  if (timeWindow === "week" || timeWindow === "weekly") {
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const from = new Date(now);
    from.setUTCDate(now.getUTCDate() - dayOfWeek);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setUTCDate(from.getUTCDate() + 6);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to };
  }

  if (timeWindow === "month" || timeWindow === "monthly") {
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    return { from, to };
  }

  return null;
}
