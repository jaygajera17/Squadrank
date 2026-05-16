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
