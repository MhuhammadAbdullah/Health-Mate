/**
 * One-time migration: backfill publicId on all existing Report and Vital records.
 *
 * Run with:
 *   node backend/seeds/migratePublicIds.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Report   = require("../models/Report");
const Vital    = require("../models/Vital");

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeId(prefix) {
  return prefix + "-" + Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
}

async function backfill(Model, prefix) {
  const docs = await Model.find({ $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: "" }] }, "_id").lean();
  if (!docs.length) {
    console.log(`  ${Model.modelName}: nothing to migrate.`);
    return;
  }

  let updated = 0;
  for (const doc of docs) {
    let id;
    do {
      id = makeId(prefix);
    } while (await Model.exists({ publicId: id }));
    await Model.updateOne({ _id: doc._id }, { $set: { publicId: id } });
    updated++;
  }
  console.log(`  ${Model.modelName}: ${updated} record(s) updated.`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB. Migrating…");
  await backfill(Report, "RPT");
  await backfill(Vital,  "VTL");
  console.log("Done.");
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
