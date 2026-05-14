import { Router } from 'express';
import { body } from 'express-validator';
import userController from '../controllers/user.controller';
import validateRequest from '../middleware/validateRequest';
import { authenticate, authorize } from '../middleware/auth';
import { authLimiter } from '../utils/rateLimiter';

const router = Router();

// ─── Validation rules ─────────────────────────────────────────────────────────

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be blank'),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/users
 * @desc    Register a new user (role defaults to "user")
 * @access  Public (rate-limited)
 */
router.post('/', authLimiter, createUserValidation, validateRequest, userController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private — admin only
 */
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private — authenticated users
 */
router.get('/:id', authenticate, userController.getUserById);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update a user
 * @access  Private — authenticated users (own account or admin)
 */
router.patch(
  '/:id',
  authenticate,
  updateUserValidation,
  validateRequest,
  userController.updateUser,
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private — admin only
 */
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

export default router;
