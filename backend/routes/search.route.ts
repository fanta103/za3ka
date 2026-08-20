import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { searchAll } from "../controllers/search.controller";
import { searchSchema } from "../validations/search.validation";

const router = express.Router();

router.get("/", protectRoute, validateRequest({ query: searchSchema }), searchAll);

export default router;
