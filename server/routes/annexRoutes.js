import express from "express";
import { fetchAnnexUserData } from "../controllers/annexController.js";
import { protect } from "../middlewares/auth.js";

const annexRouter = express.Router();

// All routes are protected
annexRouter.use(protect);

// Fetch user data from BUBT Annex
annexRouter.post("/fetch-data", fetchAnnexUserData);

export default annexRouter;

