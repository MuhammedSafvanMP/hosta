import express from "express";
import {
  createLab,
  getLabs,
  getSingleLab,
  updateLab,
  deleteLab,
} from "../Controllers/LabSide/LabFrorm";
import { trycatch } from "../Utils/TryCatch";


const router = express.Router();

router.post("/lab",  trycatch( createLab ));
router.get("/lab", trycatch( getLabs ));
router.get("/lab/:id", trycatch( getSingleLab ));
router.put("/lab/:id", trycatch( updateLab ));
router.delete("/lab/:id", trycatch( deleteLab ));

export default router;
