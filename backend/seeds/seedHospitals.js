/**
 * Seed script — populates the hospitals collection from the original hardcoded dataset.
 * Run once:  node backend/seeds/seedHospitals.js
 * Safe to re-run: clears collection first, then re-inserts.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Hospital = require("../models/Hospital");

const HOSPITALS = [
  // ── KARACHI ──────────────────────────────────────────────────────────────
  { name:"Aga Khan University Hospital",            city:"Karachi",    address:"Stadium Road, Karachi",                  phone:"021-111-911-911", type:"Private",    emergency:true,  specialties:["Cardiology","Oncology","Neurology","Pediatrics","Orthopedics"],   rating:4.8, lat:24.8915, lng:67.0723 },
  { name:"Liaquat National Hospital",               city:"Karachi",    address:"Stadium Road, Karachi",                  phone:"021-34412000",    type:"Private",    emergency:true,  specialties:["Cardiology","Neurology","Urology","General Surgery"],             rating:4.6, lat:24.8941, lng:67.0759 },
  { name:"Ziauddin Hospital",                       city:"Karachi",    address:"North Nazimabad, Karachi",               phone:"021-111-942-942", type:"Private",    emergency:true,  specialties:["Oncology","Cardiology","Gynecology","Nephrology"],                rating:4.4, lat:24.9333, lng:67.0536 },
  { name:"South City Hospital",                     city:"Karachi",    address:"Clifton, Karachi",                       phone:"021-35864871",    type:"Private",    emergency:true,  specialties:["Cardiology","Orthopedics","Neurology","General Surgery"],         rating:4.5, lat:24.8200, lng:67.0250 },
  { name:"Civil Hospital Karachi",                  city:"Karachi",    address:"Baba-e-Urdu Road, Karachi",              phone:"021-99215740",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Burns","Trauma"],                    rating:3.9, lat:24.8607, lng:67.0108 },
  { name:"Jinnah Postgraduate Medical Centre",      city:"Karachi",    address:"Rafiqui Shaheed Road, Karachi",          phone:"021-99201300",    type:"Government", emergency:true,  specialties:["Cardiology","Neurology","Surgery","Nephrology"],                  rating:4.0, lat:24.8679, lng:67.0117 },
  { name:"Indus Hospital",                          city:"Karachi",    address:"Korangi Crossing, Karachi",              phone:"021-35112709",    type:"Welfare",    emergency:true,  specialties:["Oncology","Pediatrics","General Medicine","Hematology"],          rating:4.7, lat:24.8521, lng:67.1249 },
  { name:"Patel Hospital",                          city:"Karachi",    address:"Garden East, Karachi",                   phone:"021-32770021",    type:"Private",    emergency:true,  specialties:["Orthopedics","Surgery","Cardiology","ENT"],                       rating:4.3, lat:24.8527, lng:67.0236 },
  { name:"National Medical Centre",                 city:"Karachi",    address:"Liaquatabad, Karachi",                   phone:"021-36680444",    type:"Private",    emergency:true,  specialties:["General Medicine","Cardiology","ENT","Urology"],                  rating:4.2, lat:24.9086, lng:67.0615 },
  { name:"Karachi Institute of Heart Diseases",     city:"Karachi",    address:"NICVD Road, Karachi",                    phone:"021-32568900",    type:"Government", emergency:true,  specialties:["Cardiology","Cardiac Surgery"],                                   rating:4.5, lat:24.8832, lng:67.0451 },
  { name:"Tabba Heart Institute",                   city:"Karachi",    address:"S.M.C.H.S., Karachi",                    phone:"021-34522500",    type:"Private",    emergency:true,  specialties:["Cardiology","Cardiac Surgery","Vascular Surgery"],                rating:4.7, lat:24.8732, lng:67.0327 },
  { name:"Fatimid Foundation Blood Centre",         city:"Karachi",    address:"NIPA Chowrangi, Karachi",                phone:"021-34826660",    type:"Welfare",    emergency:false, specialties:["Hematology","Blood Bank","Thalassemia","Oncology"],               rating:4.8, lat:24.9247, lng:67.1001 },
  { name:"Edhi Foundation Health Centre",           city:"Karachi",    address:"Edhi Village, Korangi, Karachi",         phone:"021-111-338-338", type:"Welfare",    emergency:true,  specialties:["General Medicine","Emergency Care","Pediatrics"],                 rating:4.2, lat:24.8414, lng:67.1294 },
  { name:"Dr. Ziauddin Hospital (Clifton)",         city:"Karachi",    address:"Clifton, Block 6, Karachi",              phone:"021-35174002",    type:"Private",    emergency:true,  specialties:["Gynecology","Pediatrics","General Surgery","Cardiology"],         rating:4.3, lat:24.8183, lng:67.0280 },
  { name:"Abbasi Shaheed Hospital",                 city:"Karachi",    address:"SITE Area, Karachi",                     phone:"021-32569800",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Orthopedics"],                       rating:3.8, lat:24.8900, lng:67.0175 },
  { name:"Sindh Government Hospital",               city:"Karachi",    address:"Murad Memon Goth, Karachi",              phone:"",                type:"Government", emergency:false, specialties:["General Medicine"],                                               rating:4.0, lat:24.9244, lng:67.2503 },

  // ── LAHORE ───────────────────────────────────────────────────────────────
  { name:"Mayo Hospital Lahore",                    city:"Lahore",     address:"Nila Gumbad, Lahore",                    phone:"042-99231404",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Dermatology","Neurology"],           rating:3.8, lat:31.5703, lng:74.3111 },
  { name:"Shaukat Khanum Cancer Hospital",          city:"Lahore",     address:"Johar Town, Lahore",                     phone:"042-35945100",    type:"Welfare",    emergency:false, specialties:["Oncology","Radiology","Chemotherapy","Radiation Therapy"],        rating:4.9, lat:31.4675, lng:74.2624 },
  { name:"Services Hospital Lahore",                city:"Lahore",     address:"Jail Road, Lahore",                      phone:"042-99203721",    type:"Government", emergency:true,  specialties:["Burns","Trauma","General Surgery"],                               rating:3.7, lat:31.5419, lng:74.3088 },
  { name:"Lahore General Hospital",                 city:"Lahore",     address:"Nila Gumbad, Lahore",                    phone:"042-99230971",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology","Pediatrics"],           rating:3.8, lat:31.5521, lng:74.3181 },
  { name:"Ittefaq Hospital",                        city:"Lahore",     address:"Model Town, Lahore",                     phone:"042-35161844",    type:"Private",    emergency:true,  specialties:["Cardiology","Orthopedics","Urology","Neurology"],                 rating:4.5, lat:31.5150, lng:74.3358 },
  { name:"Doctors Hospital & Medical Centre",       city:"Lahore",     address:"Canal Bank, Johar Town, Lahore",         phone:"042-35761999",    type:"Private",    emergency:true,  specialties:["Cardiology","Neurology","Orthopedics","Oncology"],                rating:4.6, lat:31.4752, lng:74.2598 },
  { name:"Hameed Latif Hospital",                   city:"Lahore",     address:"Shadman, Lahore",                        phone:"042-35761560",    type:"Private",    emergency:true,  specialties:["Gynecology","Pediatrics","General Surgery","Laparoscopy"],        rating:4.3, lat:31.5225, lng:74.3083 },
  { name:"Sheikh Zayed Hospital Lahore",            city:"Lahore",     address:"University Avenue, Lahore",              phone:"042-99231359",    type:"Government", emergency:true,  specialties:["Cardiology","Neurology","Transplant","Nephrology"],               rating:4.2, lat:31.5553, lng:74.3094 },
  { name:"Farooq Hospital",                         city:"Lahore",     address:"Garden Town, Lahore",                    phone:"042-35766966",    type:"Private",    emergency:true,  specialties:["General Medicine","Cardiology","Gynecology","Pediatrics"],        rating:4.4, lat:31.5013, lng:74.3270 },

  // ── ISLAMABAD ─────────────────────────────────────────────────────────────
  { name:"Pakistan Institute of Medical Sciences (PIMS)", city:"Islamabad", address:"G-8/3, Islamabad",              phone:"051-9261170",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Neurology"],            rating:4.0, lat:33.6950, lng:73.0473 },
  { name:"Shifa International Hospital",            city:"Islamabad",  address:"H-8/4, Islamabad",                       phone:"051-111-741-741", type:"Private",    emergency:true,  specialties:["Cardiology","Orthopedics","Neurology","Oncology"],                rating:4.7, lat:33.6731, lng:73.0445 },
  { name:"Maroof International Hospital",           city:"Islamabad",  address:"F-10/4, Islamabad",                      phone:"051-111-627-663", type:"Private",    emergency:true,  specialties:["Cardiology","Neurology","Oncology","Pediatrics"],                 rating:4.5, lat:33.7254, lng:73.0523 },
  { name:"Kulsum International Hospital",           city:"Islamabad",  address:"G-7/1, Blue Area, Islamabad",            phone:"051-2892990",    type:"Private",    emergency:true,  specialties:["General Medicine","Gynecology","Cardiology","Endocrinology"],     rating:4.3, lat:33.7215, lng:73.0608 },

  // ── RAWALPINDI ────────────────────────────────────────────────────────────
  { name:"Benazir Bhutto Hospital",                 city:"Rawalpindi", address:"Murree Road, Rawalpindi",                phone:"051-9290271",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics","Gynecology"],           rating:3.9, lat:33.6044, lng:73.0468 },
  { name:"Holy Family Hospital",                    city:"Rawalpindi", address:"Civil Lines, Rawalpindi",                phone:"051-9290316",    type:"Government", emergency:true,  specialties:["General Medicine","Cardiology","Surgery","Neurology"],             rating:3.8, lat:33.5979, lng:73.0479 },
  { name:"Cantonment General Hospital",             city:"Rawalpindi", address:"Tufail Road, Rawalpindi Cantt",           phone:"051-9270368",    type:"Military",   emergency:true,  specialties:["General Medicine","Surgery","Orthopedics"],                       rating:4.0, lat:33.6122, lng:73.0616 },

  // ── PESHAWAR ──────────────────────────────────────────────────────────────
  { name:"Lady Reading Hospital",                   city:"Peshawar",   address:"Peshawar Saddar",                         phone:"091-9212471",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics","Trauma"],               rating:3.9, lat:34.0093, lng:71.5751 },
  { name:"Khyber Teaching Hospital",                city:"Peshawar",   address:"Jamrud Road, Peshawar",                   phone:"091-9216420",    type:"Government", emergency:true,  specialties:["General Medicine","Cardiology","Neurology","Orthopedics"],        rating:4.0, lat:34.0121, lng:71.5839 },
  { name:"Hayatabad Medical Complex",               city:"Peshawar",   address:"Hayatabad Phase 1, Peshawar",             phone:"091-9218300",    type:"Government", emergency:true,  specialties:["Burns","Trauma","Neurology","Cardiology","Orthopedics"],          rating:4.1, lat:34.0062, lng:71.4756 },
  { name:"Northwest General Hospital",              city:"Peshawar",   address:"Hayatabad Phase 5, Peshawar",             phone:"091-5812555",    type:"Private",    emergency:true,  specialties:["Cardiology","Orthopedics","Oncology","General Surgery"],          rating:4.4, lat:34.0148, lng:71.5286 },

  // ── QUETTA ────────────────────────────────────────────────────────────────
  { name:"Civil Hospital Quetta",                   city:"Quetta",     address:"Quetta City Centre",                      phone:"081-9201071",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Trauma","Pediatrics"],               rating:3.6, lat:30.1858, lng:67.0148 },
  { name:"Sandeman Provincial Hospital",            city:"Quetta",     address:"Shahi Road, Quetta",                      phone:"081-9203016",    type:"Government", emergency:true,  specialties:["General Medicine","Pediatrics","Gynecology"],                     rating:3.7, lat:30.1861, lng:67.0168 },
  { name:"Bolan Medical Complex Hospital",          city:"Quetta",     address:"Sariab Road, Quetta",                     phone:"081-9202501",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology","Pediatrics"],           rating:3.8, lat:30.1872, lng:67.0192 },

  // ── FAISALABAD ────────────────────────────────────────────────────────────
  { name:"Allied Hospital Faisalabad",              city:"Faisalabad", address:"Jail Road, Faisalabad",                   phone:"041-9220145",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Neurology"],            rating:3.9, lat:31.4248, lng:73.0873 },
  { name:"DHQ Hospital Faisalabad",                 city:"Faisalabad", address:"Kotwali Road, Faisalabad",                phone:"041-9220021",    type:"Government", emergency:true,  specialties:["General Medicine","Orthopedics","Gynecology"],                    rating:3.7, lat:31.4156, lng:73.0851 },
  { name:"National Hospital Faisalabad",            city:"Faisalabad", address:"Canal Road, Faisalabad",                  phone:"041-8711020",    type:"Private",    emergency:true,  specialties:["Cardiology","Orthopedics","Neurology","Oncology"],                rating:4.4, lat:31.4189, lng:73.0937 },
  { name:"Faisalabad Institute of Cardiology",      city:"Faisalabad", address:"Kotwali Road, Faisalabad",                phone:"041-9220141",    type:"Government", emergency:true,  specialties:["Cardiology","Cardiac Surgery"],                                   rating:4.3, lat:31.4202, lng:73.0862 },

  // ── MULTAN ────────────────────────────────────────────────────────────────
  { name:"Nishtar Hospital Multan",                 city:"Multan",     address:"Nishtar Road, Multan",                    phone:"061-9200255",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Neurology"],            rating:4.1, lat:30.1918, lng:71.4694 },
  { name:"Children Hospital Multan",                city:"Multan",     address:"Nishtar Road, Multan",                    phone:"061-9200011",    type:"Government", emergency:true,  specialties:["Pediatrics","Pediatric Surgery","Neonatology"],                   rating:4.2, lat:30.1882, lng:71.4621 },
  { name:"Sheikh Zayed Hospital Multan",            city:"Multan",     address:"Abu Baker Siddique Road, Multan",         phone:"061-9210071",    type:"Government", emergency:true,  specialties:["General Medicine","Cardiology","Nephrology","Transplant"],        rating:4.0, lat:30.2013, lng:71.4617 },
  { name:"Multan Institute of Kidney Diseases",     city:"Multan",     address:"Multan Cantt",                            phone:"061-4546000",    type:"Government", emergency:false, specialties:["Nephrology","Urology","Transplant","Dialysis"],                   rating:4.5, lat:30.1960, lng:71.4750 },

  // ── HYDERABAD ─────────────────────────────────────────────────────────────
  { name:"Liaquat University Hospital (LUMHS)",     city:"Hyderabad",  address:"Jamshoro Road, Hyderabad",                phone:"022-9213000",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Orthopedics"],          rating:3.8, lat:25.3960, lng:68.3578 },
  { name:"Civil Hospital Hyderabad",                city:"Hyderabad",  address:"Agha Siraj Durrani Road, Hyderabad",      phone:"022-9200035",    type:"Government", emergency:true,  specialties:["General Medicine","Pediatrics","Surgery","Gynecology"],           rating:3.6, lat:25.3752, lng:68.3647 },

  // ── GUJRANWALA ────────────────────────────────────────────────────────────
  { name:"Civil Hospital Gujranwala",               city:"Gujranwala", address:"Jail Road, Gujranwala",                   phone:"055-9200185",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology"],                        rating:3.7, lat:32.1620, lng:74.1857 },
  { name:"Shaikh Khalifa Bin Zayed Hospital",       city:"Gujranwala", address:"Satellite Town, Gujranwala",              phone:"055-3744101",    type:"Government", emergency:true,  specialties:["Cardiology","General Medicine","Orthopedics"],                    rating:4.0, lat:32.1778, lng:74.2015 },

  // ── SIALKOT ────────────────────────────────────────────────────────────────
  { name:"Allama Iqbal Memorial Hospital",          city:"Sialkot",    address:"Sialkot Cantt",                            phone:"052-9250015",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Orthopedics"],                       rating:3.8, lat:32.4793, lng:74.5407 },
  { name:"Aziz Bhatti Shaheed Hospital",            city:"Sialkot",    address:"Paris Road, Sialkot",                     phone:"052-4261200",    type:"Government", emergency:true,  specialties:["General Medicine","Pediatrics","Gynecology"],                     rating:3.7, lat:32.4826, lng:74.5431 },

  // ── BAHAWALPUR ────────────────────────────────────────────────────────────
  { name:"Bahawal Victoria Hospital",               city:"Bahawalpur", address:"Circular Road, Bahawalpur",               phone:"062-9255012",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Gynecology"],           rating:4.0, lat:29.3957, lng:71.6785 },
  { name:"The Children Hospital Bahawalpur",        city:"Bahawalpur", address:"Nishtar Road, Bahawalpur",                phone:"062-9255020",    type:"Government", emergency:true,  specialties:["Pediatrics","Pediatric Surgery","Neonatology"],                   rating:4.1, lat:29.3927, lng:71.6752 },

  // ── ABBOTTABAD ────────────────────────────────────────────────────────────
  { name:"Ayub Teaching Hospital",                  city:"Abbottabad", address:"Mansehra Road, Abbottabad",               phone:"0992-380131",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Cardiology","Neurology"],            rating:4.1, lat:34.1456, lng:73.2122 },

  // ── SARGODHA ─────────────────────────────────────────────────────────────
  { name:"DHQ Teaching Hospital Sargodha",          city:"Sargodha",   address:"University Road, Sargodha",               phone:"048-9230140",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology","Pediatrics"],           rating:3.8, lat:32.0836, lng:72.6740 },

  // ── MARDAN ────────────────────────────────────────────────────────────────
  { name:"Mardan Medical Complex",                  city:"Mardan",     address:"GT Road, Mardan",                         phone:"0937-9230350",   type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics","Orthopedics"],          rating:3.9, lat:34.1977, lng:72.0445 },

  // ── LARKANA ────────────────────────────────────────────────────────────────
  { name:"Chandka Medical College Hospital",        city:"Larkana",    address:"Dr. Israr Hospital Road, Larkana",        phone:"074-9410060",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics","Gynecology"],           rating:3.6, lat:27.5612, lng:68.2151 },

  // ── SUKKUR ────────────────────────────────────────────────────────────────
  { name:"Government Hospital Sukkur",              city:"Sukkur",     address:"Military Road, Sukkur",                   phone:"071-9310040",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics"],                        rating:3.5, lat:27.7019, lng:68.8562 },

  // ── DERA GHAZI KHAN ───────────────────────────────────────────────────────
  { name:"DHQ Hospital D.G. Khan",                  city:"D.G. Khan",  address:"Dera Road, D.G. Khan",                    phone:"064-9260040",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology"],                        rating:3.7, lat:30.0520, lng:70.6416 },

  // ── SHEIKHUPURA ───────────────────────────────────────────────────────────
  { name:"DHQ Hospital Sheikhupura",                city:"Sheikhupura",address:"Faisalabad Road, Sheikhupura",            phone:"056-9200025",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology"],                        rating:3.6, lat:31.7114, lng:73.9851 },

  // ── GUJRAT ────────────────────────────────────────────────────────────────
  { name:"DHQ Hospital Gujrat",                     city:"Gujrat",     address:"Civil Lines, Gujrat",                     phone:"053-3521225",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics"],                        rating:3.7, lat:32.5748, lng:74.0789 },

  // ── SAHIWAL ────────────────────────────────────────────────────────────────
  { name:"DHQ Hospital Sahiwal",                    city:"Sahiwal",    address:"Hospital Road, Sahiwal",                  phone:"040-9200280",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology","Orthopedics"],          rating:3.8, lat:30.6706, lng:73.1065 },

  // ── NAWABSHAH ─────────────────────────────────────────────────────────────
  { name:"People Medical College Hospital",         city:"Nawabshah",  address:"Shaheed Benazirabad, Nawabshah",           phone:"0244-310008",    type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Gynecology"],                        rating:3.6, lat:26.2455, lng:68.4116 },

  // ── MIRPUR AJK ────────────────────────────────────────────────────────────
  { name:"Divisional Headquarters Hospital Mirpur", city:"Mirpur (AJK)",address:"Raja Bazar, Mirpur, AJK",               phone:"05827-440044",   type:"Government", emergency:true,  specialties:["General Medicine","Surgery","Pediatrics","Gynecology"],           rating:3.8, lat:33.1469, lng:73.7508 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const before = await Hospital.countDocuments();
    await Hospital.deleteMany({});
    console.log(`🗑  Cleared ${before} existing hospital records`);

    const inserted = await Hospital.insertMany(HOSPITALS);
    console.log(`✅ Seeded ${inserted.length} hospitals successfully`);

    const cities = [...new Set(HOSPITALS.map(h => h.city))].sort();
    console.log(`📍 Cities covered (${cities.length}): ${cities.join(", ")}`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

seed();
