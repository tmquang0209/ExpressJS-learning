import express from "express";
import { createBooking, getBookingDetails, getBookingList, updateBooking, updatePayment, updateStatus } from "../controllers/bookingController.js";
import { bookingStatus, bookingValidation } from "../middlewares/validate.js";
import validateError from "../middlewares/validateError.js";
import authorize from "../middlewares/authorization.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", authorize(["GUEST"]), bookingValidation, validateError, createBooking);

bookingRouter.get("/details", authorize(["GUEST", "OWNER"]), getBookingDetails);

bookingRouter.get("/list", authorize(["GUEST", "OWNER"]), getBookingList);

bookingRouter.put("/update", authorize(["OWNER"]), bookingValidation, validateError, updateBooking);

bookingRouter.put("/update-status", authorize(["GUEST", "OWNER"]), bookingStatus, validateError, updateStatus);

bookingRouter.put("/update-payment", authorize(["OWNER"]), updatePayment);
// patch
export default bookingRouter;
