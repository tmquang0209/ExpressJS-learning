import { Model } from "objection";
import Booking from "./booking.js";

class Invoices extends Model {
    static get tableName() {
        return "invoices";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: [],
            properties: {
                id: { type: "integer" },
                booking_id: { type: "integer" },
                total: { type: "integer" },
                payment_method: { type: "string" },
                payment_date: { type: "string", format: "date-time" },
                status: { type: "string" },
                create_at: { type: "string", format: "date-time" },
            },
        };
    }

    static get relationMappings() {
        return {
            booking: {
                relation: Model.BelongsToOneRelation,
                modelClass: Booking,
                join: {
                    from: "invoices.booking_id",
                    to: "booking.id",
                },
            },
        };
    }
}

export default Invoices;
