import express from "express";
import { fetchAllType } from "../controllers/type.controller.js";

const typeRoutes = express.Router();

typeRoutes.get("/", fetchAllType);

export default typeRoutes;
