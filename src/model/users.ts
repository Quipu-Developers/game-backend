import { model, Schema } from "mongoose";

export const Users = model(
    "users",
    new Schema({
        userName: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        score: {
            type: Number,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
    })
);
