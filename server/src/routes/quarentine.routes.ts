import { Router } from "express";
import {
  getQuarantineRow,
  revalidateQuarantineRow,
  updateQuarantine,
} from "../controllers/quarentine.controller.js";

const router = Router();

router.get("/:id", getQuarantineRow);
router.post("/:id/revalidate", revalidateQuarantineRow);
router.patch("/:id", updateQuarantine);

export default router;
