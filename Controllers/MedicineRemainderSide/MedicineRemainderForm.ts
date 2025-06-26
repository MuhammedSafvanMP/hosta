import { Request, Response } from "express";
import MedicineRemainder from "../../Model/MedicineRemainderSchema";
import createError from "http-errors";
import moment from 'moment';

export const checkMissedDoses = async () => {
  const now = moment();

  const medicines = await MedicineRemainder.find({ reminder: true });

  for (const medicine of medicines) {
    const start = moment(medicine.startDate);
    const end = medicine.days === "ongoing"
      ? moment().add(100, "years")
      : moment(start).add(medicine.days, "days");

    if (now.isBefore(start) || now.isAfter(end)) continue;

    let updated = false;

    for (const dateEntry of medicine.dates) {
      if (moment(dateEntry.date).format("YYYY-MM-DD") !== now.format("YYYY-MM-DD")) continue;

      for (const timeEntry of dateEntry.times) {
        const scheduledTime = moment(timeEntry.time, "h:mm a").set({
          year: now.year(),
          month: now.month(),
          date: now.date(),
        });

        const diffInMinutes = now.diff(scheduledTime, "minutes");

        if (diffInMinutes >= 4 && timeEntry.status === "take") {
          timeEntry.status = "missed";
          updated = true;
        }
      }
    }

    if (updated) {
      // 🔥 This tells Mongoose to detect changes in the nested `dates` array
      medicine.markModified('dates');
      await medicine.save();
      console.log(`⏰ Missed doses updated for medicine: ${medicine.name}`);
    }
  }

  console.log("✅ Missed medicine check complete");
};


// refilltracking

export const checkAndRefillMedicines = async () => {
  const medicines = await  MedicineRemainder.find({ refillTracking: true });

  for (const medicine of medicines) {
    // Skip if no dates
    if (!medicine.dates || medicine.dates.length === 0) continue;

    const lastDateObj = medicine.dates[medicine.dates.length - 1];
    const lastDate = moment(lastDateObj.date).startOf("day");
    const today = moment().startOf("day");

    // Only proceed if lastDate is before today
    if (lastDate.isBefore(today)) {
      const newStartDate = moment().startOf("day"); // e.g., today at 00:00
      const daysToAdd = medicine.days || 7; // default to 7
      const timesTemplate = medicine.dates[0].times.map((t: any) => t.time); // reuse time(s)

      for (let i = 0; i < daysToAdd; i++) {
        const date = moment(newStartDate).add(i, "days").toDate();
        const times = timesTemplate.map((time: any)  => ({
          time,
          status: "take",
        }));

        medicine.dates.push({ date, times });
      }

      // Update the startDate to the new refill period
      medicine.startDate = newStartDate.toDate();

      await medicine.save();
      console.log(`Refilled medicine: ${medicine.name}`);
    }
  }
};





// ✅ Create Medicine Remainder
export const createMedicine = async (req: Request, res: Response): Promise<Response> => {
  try {
    const data = req.body;
    const { startDate, days, times, often } = data;

    if (!startDate || !days || !Array.isArray(times) || times.length === 0 || !often) {
      return res.status(400).json({ error: "startDate, days, times[], and often are required" });
    }

    // Optional: Validate that times.length matches "often"
    const oftenMap: Record<string, number> = {
      "once daily": 1,
      "twice daily": 2,
      "three times daily": 3,
      "four times daily": 4
    };

    if (often !== "as needed" && times.length !== oftenMap[often]) {
      return res.status(400).json({ error: `Expected ${oftenMap[often]} time(s) for '${often}', but got ${times.length}` });
    }

    const dateList = [];
    const start = moment(startDate);

    for (let i = 0; i < (days === "ongoing" ? 30 : days); i++) {
      const currentDate = moment(start).add(i, "days").format("YYYY-MM-DD");

      dateList.push({
        date: currentDate,
        times: times.map((t: string) => ({
          time: t,
          status: "take"
        }))
      });
    }

    const medicine = new MedicineRemainder({
      ...data,
      dates: dateList
    });

    await medicine.save();

    return res.status(201).json({ message: "Medicine remainder created", medicine });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create medicine remainder" });
  }
};



// 🔍 Get All Medicines (with pagination & optional search)
export const getMedicines = async (req: Request, res: Response): Promise<Response> => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const {userId} = req.params;
  const query = {
    name: { $regex: search, $options: "i" },
  };

  const medicines = await MedicineRemainder.find({
    userId,
    ...query
  })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort({ createdAt: -1 });
  

  const total = await MedicineRemainder.countDocuments(query);

  return res.status(200).json({
    medicines,
    total,
    page: +page,
    totalPages: Math.ceil(total / +limit),
  });
};

// 📄 Get Single Medicine by ID
export const getSingleMedicine = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid medicine ID");

  const medicine = await MedicineRemainder.findOne({_id: id});
  
  if (!medicine) throw new createError.NotFound("Medicine not found");

  return res.status(200).json(medicine);
};

// 📝 Update Medicine by ID
export const updateMedicine = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ error: "Invalid medicine ID" });
    }

    const { startDate, days, times, often } = updateData;

    // Regenerate dates only if necessary fields are provided
    if (startDate && days && Array.isArray(times) && times.length > 0 && often) {
      const oftenMap: Record<string, number> = {
        "once daily": 1,
        "twice daily": 2,
        "three times daily": 3,
        "four times daily": 4
      };

      if (often !== "as needed" && times.length !== oftenMap[often]) {
        return res.status(400).json({
          error: `Expected ${oftenMap[often]} time(s) for '${often}', but got ${times.length}`
        });
      }

      const dateList = [];
      const start = moment(startDate);

      for (let i = 0; i < (days === "ongoing" ? 30 : days); i++) {
        const currentDate = moment(start).add(i, "days").format("YYYY-MM-DD");

        dateList.push({
          date: currentDate,
          times: times.map((t: string) => ({
            time: t,
            status: "take"
          }))
        });
      }

      updateData.dates = dateList;
    }

    const medicine = await MedicineRemainder.findByIdAndUpdate(id, updateData, { new: true });
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    return res.status(200).json({ message: "Medicine updated", medicine });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update medicine" });
  }
};


// ❌ Delete Medicine by ID
export const deleteMedicine = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid medicine ID");

  const medicine = await MedicineRemainder.findByIdAndDelete(id);
  if (!medicine) throw new createError.NotFound("Medicine not found");

  return res.status(200).json({ message: "Medicine deleted successfully" });
};


export const editMedicineStatus = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { time } = req.body;

  if (!time) {
    return res.status(400).json({ message: "Time is required" });
  }

  const medicine = await MedicineRemainder.findById(id);
  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found" });
  }

  const today = moment().format("YYYY-MM-DD");

  // Find today's entry
  const todayEntry = medicine.dates.find(dateEntry =>
    moment(dateEntry.date).format("YYYY-MM-DD") === today
  );

  if (!todayEntry) {
    return res.status(404).json({ message: "Today's schedule not found" });
  }

  // Find the time entry
  const timeEntry = todayEntry.times.find(t => t.time === time);
  if (!timeEntry) {
    return res.status(404).json({ message: "Scheduled time not found" });
  }

  // Update status
  timeEntry.status = "taken";

  // Mark nested field as modified
  medicine.markModified('dates');

  await medicine.save();

  return res.status(200).json({
    message: "Medicine status updated to taken",
    updated: timeEntry,
  });
};


//  export const alaram = async (req: Request, res: Response): Promise<any> => {

//   const now = moment();
//   const medicines = await MedicineRemainder.find({ reminder: true });

//   let anyMissed = false;

//   for (const medicine of medicines) {
//     for (const dateEntry of medicine.dates) {
//       if (moment(dateEntry.date).format("YYYY-MM-DD") !== now.format("YYYY-MM-DD")) continue;

//       for (const timeEntry of dateEntry.times) {
//         const scheduledTime = moment(timeEntry.time, "h:mm a").set({
//           year: now.year(),
//           month: now.month(),
//           date: now.date(),
//         });

//         const diffInMinutes = now.diff(scheduledTime, "minutes");

//         if (diffInMinutes >= 4 && timeEntry.status === "missed") {
//           anyMissed = true;
//           break;
//         }
//       }
//     }

//     if (anyMissed) break;
//   }

//   res.json({ missed: anyMissed });
// };
