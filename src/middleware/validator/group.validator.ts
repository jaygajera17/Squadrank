import { RequestHandler } from "express";
import { body, param } from "express-validator";
import validateRequest from "../validateRequest";
import StudyGroup from "../../models/studyGroup.model";
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
