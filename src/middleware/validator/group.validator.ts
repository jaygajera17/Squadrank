import { RequestHandler } from "express";
import { body, param } from "express-validator";
import validateRequest from "../validateRequest";
import StudyGroup from "../../models/studyGroup.model";
import Subject from "../../models/subject.model";
import userService from "../../services/user.service";

export const createGroupValidator: RequestHandler[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage({
      message: "name is required",
      code: "NAME_REQUIRED",
    })
    .bail()
    .custom(async (_value, { req }) => {
      const creatorId = req.user?.id;
      if (!creatorId) {
        return Promise.reject({
          message: "creator is required",
          code: "CREATOR_REQUIRED",
          statusCode: 401,
        });
      }

      const existingGroup = await StudyGroup.findOne({ creatorId });
      if (existingGroup) {
        return Promise.reject({
          message: "creator already has a group",
          code: "CREATOR_ALREADY_HAS_GROUP",
          details: "A creator can own only one group.",
          statusCode: 409,
        });
      }
      return true;
    }),
  body("members").optional().isArray().withMessage({
    message: "members must be an array",
    code: "MEMBERS_INVALID_TYPE",
  }),
  body("members.*").optional().isEmail().withMessage({
    message: "members must contain valid emails",
    code: "MEMBERS_EMAIL_INVALID",
  }),
  body("members")
    .optional()
    .custom(async (members) => {
      if (!Array.isArray(members) || members.length === 0) {
        return true;
      }

      const uniqueEmails = Array.from(
        new Set(members.map((email) => String(email))),
      );
      const userIds = await userService.getUserIdsByEmails(uniqueEmails);
      if (userIds.length !== uniqueEmails.length) {
        return Promise.reject({
          message: "one or more members do not exist",
          code: "MEMBERS_NOT_FOUND",
          details: "One or more member emails do not exist.",
          statusCode: 404,
        });
      }
      return true;
    }),
  validateRequest,
];

export const addGroupMemberValidator: RequestHandler[] = [
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
    .custom(async (groupId, { req }) => {
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${groupId} does not exist.`,
          statusCode: 404,
        });
      }

      const isMember = group.members.some((m) => m.toString() === req.user?.id);
      if (!isMember) {
        return Promise.reject({
          message: "you are not a member of this group",
          code: "NOT_A_MEMBER",
          statusCode: 403,
        });
      }

      if (!req.user?.id || group.creatorId.toString() !== req.user.id) {
        return Promise.reject({
          message: "only the creator can add members",
          code: "ONLY_CREATOR_CAN_ADD_MEMBERS",
          statusCode: 403,
        });
      }
      return true;
    }),
  body("email")
    .trim()
    .notEmpty()
    .withMessage({
      message: "email is required",
      code: "EMAIL_REQUIRED",
    })
    .isEmail()
    .withMessage({
      message: "email must be a valid email",
      code: "EMAIL_INVALID",
    })
    .bail()
    .custom(async (email, { req }) => {
      const user = await userService.getUserByEmail(String(email));
      if (!user) {
        return Promise.reject({
          message: "user not found",
          code: "USER_NOT_FOUND",
          details: `No user found with email ${String(email)}.`,
          statusCode: 404,
        });
      }

      const group = await StudyGroup.findById(req.params?.groupId);
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${String(req.params?.groupId)} does not exist.`,
          statusCode: 404,
        });
      }

      const isMember = group.members.some(
        (memberId) => memberId.toString() === user._id.toString(),
      );
      if (isMember) {
        return Promise.reject({
          message: "User is already a member of this group",
          code: "USER_ALREADY_MEMBER",
          details: `The email ${String(email)} is already part of this group.`,
          statusCode: 409,
        });
      }
      return true;
    }),
  validateRequest,
];

export const addGroupGoalValidator: RequestHandler[] = [
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
    .custom(async (groupId, { req }) => {
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${groupId} does not exist.`,
          statusCode: 404,
        });
      }

      if (!req.user?.id || group.creatorId.toString() !== req.user.id) {
        return Promise.reject({
          message: "only the creator can add goals",
          code: "ONLY_CREATOR_CAN_ADD_GOAL",
          statusCode: 403,
        });
      }

      if (group.activeGoalId) {
        return Promise.reject({
          message: "active goal already exists",
          code: "ACTIVE_GOAL_EXISTS",
          details: "Archive the current goal before adding a new one.",
          statusCode: 409,
        });
      }

      return true;
    }),
  body("title").trim().notEmpty().withMessage({
    message: "title is required",
    code: "TITLE_REQUIRED",
  }),
  body("subjectIds").isArray({ min: 1 }).withMessage({
    message: "subjectIds must be a non-empty array",
    code: "SUBJECT_IDS_REQUIRED",
  }),
  body("subjectIds.*").isMongoId().withMessage({
    message: "subjectIds must contain valid ids",
    code: "SUBJECT_ID_INVALID",
  }),
  body("subjectIds").custom(async (subjectIds) => {
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return true;
    }

    const uniqueIds = Array.from(new Set(subjectIds.map((id) => String(id))));
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
  body("metric").optional().isIn(["questionsSolved", "timeSpent"]).withMessage({
    message: "metric must be questionsSolved or timeSpent",
    code: "METRIC_INVALID",
  }),
  body("targetCount")
    .notEmpty()
    .withMessage({
      message: "targetCount is required",
      code: "TARGET_COUNT_REQUIRED",
    })
    .bail()
    .isInt({ gt: 0 })
    .withMessage({
      message: "targetCount must be a positive integer",
      code: "TARGET_COUNT_INVALID",
    }),
  body("goalType")
    .notEmpty()
    .withMessage({
      message: "goalType is required",
      code: "GOAL_TYPE_REQUIRED",
    })
    .bail()
    .isIn(["deadline", "recurring"])
    .withMessage({
      message: "goalType must be deadline or recurring",
      code: "GOAL_TYPE_INVALID",
    }),
  body("deadline").custom((value, { req }) => {
    if (req.body?.goalType !== "deadline") {
      return true;
    }

    if (!value) {
      return Promise.reject({
        message: "deadline is required for deadline goals",
        code: "DEADLINE_REQUIRED",
      });
    }

    const parsedDeadline = new Date(value);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return Promise.reject({
        message: "deadline must be a valid date",
        code: "DEADLINE_INVALID",
      });
    }

    if (parsedDeadline <= new Date()) {
      return Promise.reject({
        message: "deadline must be in the future",
        code: "DEADLINE_PAST",
      });
    }

    return true;
  }),
  body("frequency").custom((value, { req }) => {
    if (req.body?.goalType !== "recurring") {
      return true;
    }

    if (!value) {
      return Promise.reject({
        message: "frequency is required for recurring goals",
        code: "FREQUENCY_REQUIRED",
      });
    }

    const allowed = ["daily", "weekly", "monthly"];
    if (!allowed.includes(String(value))) {
      return Promise.reject({
        message: "frequency must be daily, weekly, or monthly",
        code: "FREQUENCY_INVALID",
      });
    }

    return true;
  }),
  validateRequest,
];

export const addGroupMemberActivityValidator: RequestHandler[] = [
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
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${groupId} does not exist.`,
          statusCode: 404,
        });
      }
      return true;
    }),
  body("questionId")
    .notEmpty()
    .withMessage({
      message: "questionId is required",
      code: "QUESTION_ID_REQUIRED",
    })
    .isMongoId()
    .withMessage({
      message: "questionId must be a valid id",
      code: "QUESTION_ID_INVALID",
    }),
  body("status")
    .notEmpty()
    .withMessage({
      message: "status is required",
      code: "STATUS_REQUIRED",
    })
    .isString()
    .withMessage({
      message: "status must be a string",
      code: "STATUS_INVALID_TYPE",
    })
    .bail()
    .trim(),
  body("timeSpent")
    .notEmpty()
    .withMessage({
      message: "timeSpent is required",
      code: "TIME_SPENT_REQUIRED",
    })
    .isInt({ min: 0 })
    .withMessage({
      message: "timeSpent must be a non-negative integer",
      code: "TIME_SPENT_INVALID",
    })
    .toInt(),
  validateRequest,
];

export const getGroupProgressValidator: RequestHandler[] = [
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
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return Promise.reject({
          message: "group not found",
          code: "GROUP_NOT_FOUND",
          details: `Group id ${groupId} does not exist.`,
          statusCode: 404,
        });
      }
      return true;
    }),
  validateRequest,
];
