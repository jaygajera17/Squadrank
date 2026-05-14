import userController from '@/controllers/user.controller';
import { authenticate } from '@/middleware/auth';
import { Router } from 'express';

class UserRouter {
  public router: Router = Router();

   constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      '/',
      authenticate,
      userController.getAllUsers,
    );
  }
}




export default new UserRouter().router;
