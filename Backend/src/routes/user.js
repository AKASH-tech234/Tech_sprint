import { Router } from "express";

import { signup,login } from "../controllers/user.controller.js";

const router = Router();

// signup → citizen / official / community
router.post("/signup", signup);

// login → all roles
router.post("/login", login);

export default router;