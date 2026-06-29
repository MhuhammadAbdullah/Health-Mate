/**
 * Seed emergency services collection.
 * Run once:  node backend/seeds/seedEmergency.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose  = require("mongoose");
const Emergency = require("../models/Emergency");

const SERVICES = [
  { order:1,  name:"Rescue / Police",      number:"15",              color:"#185FA5", icon:"bx bxs-badge-check",   desc:"Police emergency helpline"        },
  { order:2,  name:"Ambulance (Edhi)",      number:"115",             color:"#A32D2D", icon:"bx bx-plus-medical",   desc:"Edhi Foundation ambulance"        },
  { order:3,  name:"Fire Brigade",          number:"16",              color:"#993C1D", icon:"bx bxs-flame",         desc:"Fire emergency response"          },
  { order:4,  name:"Rescue 1122",           number:"1122",            color:"#0F6E56", icon:"bx bxs-first-aid",     desc:"Emergency rescue (Punjab)"        },
  { order:5,  name:"Chippa Ambulance",      number:"1020",            color:"#A32D2D", icon:"bx bx-plus-medical",   desc:"Chippa welfare ambulance"         },
  { order:6,  name:"Aman Foundation",       number:"115",             color:"#185FA5", icon:"bx bxs-heart",         desc:"Health helpline Karachi"          },
  { order:7,  name:"Disaster Mgmt",         number:"021-111-111-100", color:"#854F0B", icon:"bx bxs-error",         desc:"National disaster management"     },
  { order:8,  name:"Child Protection",      number:"1099",            color:"#533AB7", icon:"bx bxs-baby-carriage", desc:"Child protection helpline"        },
  { order:9,  name:"Sehat Sahulat",         number:"0800-15000",      color:"#0F6E56", icon:"bx bxs-clinic",        desc:"Govt health helpline (toll-free)" },
  { order:10, name:"Mental Health (Umang)", number:"0317-4288665",    color:"#533AB7", icon:"bx bxs-brain",         desc:"Mental health helpline"           },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const before = await Emergency.countDocuments();
    await Emergency.deleteMany({});
    console.log(`🗑  Cleared ${before} existing records`);

    const inserted = await Emergency.insertMany(SERVICES);
    console.log(`✅ Seeded ${inserted.length} emergency services`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

seed();
