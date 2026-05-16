import { RequestHandler } from "express";
import { header, query } from "express-validator";
import validateRequest from "../validateRequest";

export const googleCallbackValidator: RequestHandler[] = [
  query("code").trim().notEmpty().withMessage({
    message: "code is required",
    code: "AUTH_CODE_REQUIRED",
  }),
  validateRequest,
];

export const verifyTokenValidator: RequestHandler[] = [
  header("authorization")
    .notEmpty()
    .withMessage({
      message: "Authorization header is required",
      code: "AUTHORIZATION_REQUIRED",
    })
    .matches(/^Bearer\s.+$/)
    .withMessage({
      message: "Authorization header must be a Bearer token",
      code: "AUTHORIZATION_INVALID",
    }),
  validateRequest,
];
