import { RequestHandler } from "express";
import { param, query } from "express-validator";
import mongoose from "mongoose";
import validateRequest from "../validateRequest";
import StudyGroup from "../../models/studyGroup.model";
import Subject from "../../models/subject.model";

const parseSubjectIds = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getLeaderboardValidator: RequestHandler[] = [
  param("groupId")
    .notEmpty()
    .withMessage({
      message: "groupId is required",
      code: "GROUP_ID_REQUIRED",
    })
    .isMongoId()
    .withMessage({
      message: "groupId must be a valid id",
      code: "GROUP_ID_INVALID",
    })
    .bail()
    .custom(async (groupId) => {
      const group = await StudyGroup.findById(groupId).select("_id").lean();
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${String(groupId)} does not exist.`,
          statusCode: 404,
        });
      }
      return true;
    }),
  query("metric")
    .optional()
    .isIn(["questionsSolved", "timeSpent", "percentage", "questionSolved"])
    .withMessage({
      message: "metric must be questionsSolved, percentage, or timeSpent",
      code: "METRIC_INVALID",
    }),
  query("timeWindow")
    .optional()
    .isIn(["day", "week", "month", "all", "daily", "weekly", "monthly"])
    .withMessage({
      message: "timeWindow must be day, week, month, or all",
      code: "TIME_WINDOW_INVALID",
    }),
  query("sortBy")
    .optional()
    .isIn(["questionsSolved", "timeSpent", "percentage", "userName"])
    .withMessage({
      message:
        "sortBy must be questionsSolved, percentage, timeSpent, or userName",
      code: "SORT_BY_INVALID",
    }),
  query("sort").optional().isIn(["asc", "desc"]).withMessage({
    message: "sort must be asc or desc",
    code: "SORT_INVALID",
  }),
  query("offset").optional().isInt({ min: 0 }).withMessage({
    message: "offset must be a non-negative integer",
    code: "OFFSET_INVALID",
  }),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage({
    message: "limit must be an integer between 1 and 50",
    code: "LIMIT_INVALID",
  }),
  query("subject")
    .optional()
    .custom(async (value) => {
      if (typeof value !== "string") {
        return Promise.reject({
          message: "subject must be a comma-separated string",
          code: "SUBJECT_INVALID_TYPE",
        });
      }

      const subjectIds = parseSubjectIds(value);
      if (subjectIds.length === 0) {
        return true;
      }

      const uniqueIds = Array.from(new Set(subjectIds));
      const invalidIds = uniqueIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id),
      );
      if (invalidIds.length > 0) {
        return Promise.reject({
          message: "subject must contain valid ids",
          code: "SUBJECT_ID_INVALID",
        });
      }

      const subjectCount = await Subject.countDocuments({
        _id: { $in: uniqueIds },
      });
      if (subjectCount !== uniqueIds.length) {
        return Promise.reject({
          message: "one or more subjects do not exist",
          code: "SUBJECT_NOT_FOUND",
          details: "One or more subject ids do not exist.",
          statusCode: 404,
        });
      }

      return true;
    }),
  validateRequest,
];
