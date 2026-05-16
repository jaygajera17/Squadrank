export interface IGetLeaderBoard {
    groupId: string;
    metric: "questionsSolved" | "timeSpent" | "percentage";
    timeWindow: "day" | "week" | "month" | "all";
    subjectIds?: string[];
    sortBy?: "questionsSolved" | "timeSpent" | "percentage" | "userName";
    sort?: "asc" | "desc";
    offset?: number;
    limit?: number;
    viewerId?: string;
}