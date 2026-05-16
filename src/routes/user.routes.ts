import userController from '../controllers/user.controller';
import { Router } from 'express';
class UserRouter {
  public router: Router = Router();

   constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      '/',
      userController.getAllUsers,
    );


  }

  

}




export default new UserRouter().router;
