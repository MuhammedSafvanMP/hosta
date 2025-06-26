import express from "express";
import {
  createMedicine,
  getMedicines,
  getSingleMedicine,
  updateMedicine,
  deleteMedicine,
  editMedicineStatus
} from "../Controllers/MedicineRemainderSide/MedicineRemainderForm";
import { trycatch } from "../Utils/TryCatch";


const router = express.Router();



router.post("/medicines", trycatch( createMedicine ));
router.get("/medicines/:userId/users", trycatch( getMedicines ));
router.get("/medicines/:id", trycatch( getSingleMedicine ));
router.put("/medicines/:id", trycatch( updateMedicine ));
router.put("/medicines/:id/status", trycatch( editMedicineStatus ));
router.delete("/medicines/:id", trycatch( deleteMedicine ));
// router.get("/medicines/check-missed", trycatch( alaram ));



export default router;
