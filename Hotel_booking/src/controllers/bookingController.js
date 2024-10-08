import Booking from "../models/booking.js";
import Invoices from "../models/invoices.js";
import BookingService from "../services/bookingService.js";
import HotelService from "../services/hotelService.js";
import RoomService from "../services/roomService.js";
import ApiException from "../utils/apiException.js";
import { apiResponse } from "../utils/apiResponse.js";
import Exception from "../utils/exception.js";

// create
export async function createBooking(req, res) {
    const { hotelId, arrivalDate, departureDate, numAdults, numChildren, rooms, services, paymentMethod } = req.body;
    const user = req.user;
    let totalPrice = 0,
        totalServicePrice = 0,
        totalRoomPrice = 0;

    try {
        // check hotel
        await HotelService.checkExists(hotelId);

        // check room availability
        for (const room of rooms) {
            await RoomService.checkAvailability(hotelId, room.type, room.qty);
        }

        // check service availability
        await HotelService.checkServiceExists(hotelId, services);

        // create booking
        const bookingData = {
            guest_id: user.id,
            hotel_id: hotelId,
            arrival_date: arrivalDate,
            departure_date: departureDate,
            num_adults: numAdults,
            num_children: numChildren,
        };

        const booking = await BookingService.createBooking(bookingData);

        // create booking details
        if (rooms) {
            const roomDetails = await BookingService.addRooms(booking.id, hotelId, rooms);
            totalRoomPrice += roomDetails.totalRoomPrice;
        }

        if (services) {
            const serviceDetails = await BookingService.addServices(booking.id, hotelId, services);

            totalServicePrice += serviceDetails.totalServicePrice;
        }

        // calculate invoice
        const invoiceDetails = await BookingService.calculateInvoice(arrivalDate, departureDate, totalRoomPrice, totalServicePrice);

        totalPrice = invoiceDetails.total;
        invoiceDetails.days;

        // create invoice
        await BookingService.createInvoice(booking.id, totalPrice, paymentMethod);

        const data = await BookingService.getBookingDetails(booking.id, user);

        return res.json(apiResponse(1037, true, { ...data, roomPrice: totalRoomPrice, servicePrice: totalServicePrice, totalPrice: totalPrice }));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}

// read
export async function getBookingDetails(req, res) {
    const { id } = req.query;
    const user = req.user;
    try {
        const data = await BookingService.getBookingDetails(id, user);

        return res.json(apiResponse(1043, true, data));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}

export async function getBookingList(req, res) {
    const user = req.user;
    try {
        const data = await BookingService.getBookingList(user);
        return res.json(apiResponse(1044, true, data));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}

// update
export async function updateBooking(req, res) {
    const { id } = req.query;
    const bookingId = parseInt(id);
    const { hotelId, arrivalDate, departureDate, numAdults, numChildren, rooms, services } = req.body;
    const user = req.user;
    try {
        // await HotelService.checkExists(hotelId, user.id);
        await BookingService.getBookingDetails(bookingId, user);

        const dataUpdate = {
            arrival_date: arrivalDate,
            departure_date: departureDate,
            num_adults: numAdults,
            num_children: numChildren,
        };

        await BookingService.updateBookingDetails(bookingId, dataUpdate);
        let totalRoomPrice = 0,
            totalServicePrice = 0;
        if (rooms) {
            await BookingService.deleteBookingRoom(bookingId);
            const roomDetails = await BookingService.addRooms(bookingId, hotelId, rooms);

            totalRoomPrice += roomDetails.totalRoomPrice;
        }

        if (services) {
            await BookingService.deleteBookingService(bookingId);
            const serviceDetails = await BookingService.addServices(bookingId, hotelId, services);

            totalServicePrice += serviceDetails.totalServicePrice;
        }

        const data = await BookingService.getBookingDetails(bookingId, user);

        return res.json(apiResponse(1038, true, { ...data, totalRoomPrice, totalServicePrice }));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}

export async function updateStatus(req, res) {
    const { id } = req.query;
    const { status } = req.body;
    const user = req.user;
    try {
        const details = await BookingService.getBookingDetails(id, user);
        if (["CANCELLED", "FINISHED"].includes(details.status)) {
            throw new ApiException(1040);
        }
        await BookingService.updateStatus(id, status);

        const data = await BookingService.getBookingDetails(id, user);

        return res.json(apiResponse(1039, true, data));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}

export async function updatePayment(req, res) {
    const { id } = req.query;
    const { payment_method, status } = req.body;
    try {
        // check booking status
        const booking = await Booking.query().findById(id);

        if (["CANCELLED", "FINISHED"].includes(booking.status)) {
            throw new ApiException(1040);
        }

        const invoice = await Invoices.query().findOne({
            booking_id: id,
        });

        if (!invoice) {
            throw new ApiException(1041);
        }
        var data;
        if (payment_method) {
            data = await Invoices.query().patchAndFetchById(invoice.id, {
                payment_method,
            });
        }

        if (status) {
            data = await Invoices.query().patchAndFetchById(invoice.id, {
                status,
            });
        }

        return res.json(apiResponse(1042, true, data));
    } catch (error) {
        Exception.handle(error, req, res);
    }
}
