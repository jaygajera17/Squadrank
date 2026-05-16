import { NODE_ENV } from "../config/secrets";
import devLogger from "./devLogger";
import productionLogger from "./productionLogger";

    
const logger = NODE_ENV === 'development' ? devLogger() : productionLogger();

export default logger;
