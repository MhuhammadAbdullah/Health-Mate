const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  clerkUserId:      { type: String, required: true, unique: true, index: true },
  profilePicture:   { type: String, default: "" },
  name:             { type: String, trim: true, default: "" },
  country:          { type: String, trim: true, default: "" },   // ISO2 code e.g. "PK"
  phoneCountryCode: { type: String, trim: true, default: "" },   // e.g. "+92"
  phoneNumber:      { type: String, trim: true, default: "" },   // local number
  phone:            { type: String, trim: true, default: "" },   // legacy field
  city:             { type: String, trim: true, default: "" },
  gender:           { type: String, enum: ["male","female","other",""], default: "" },
  bloodGroup:       { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown",""], default: "" },
  dateOfBirth:      { type: Date },
}, { timestamps: true });
module.exports = mongoose.model("UserProfile", schema);
