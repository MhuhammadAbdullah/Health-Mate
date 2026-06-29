import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i) => twMerge(clsx(i));
export const REPORT_TYPES = [
  { value:"blood_test",     label:"Blood Test / CBC",  icon:"bx bx-droplet",           color:"text-red-500",    bg:"bg-red-50"    },
  { value:"urine_test",     label:"Urine Test",        icon:"bx bx-test-tube",          color:"text-blue-500",   bg:"bg-blue-50"   },
  { value:"xray",           label:"X-Ray",             icon:"ti ti-bone",               color:"text-purple-500", bg:"bg-purple-50" },
  { value:"mri",            label:"MRI Scan",          icon:"fa-solid fa-brain",        color:"text-indigo-500", bg:"bg-indigo-50" },
  { value:"ct_scan",        label:"CT Scan",           icon:"ti ti-scan",               color:"text-cyan-600",   bg:"bg-cyan-50"   },
  { value:"ultrasound",     label:"Ultrasound",        icon:"bx bx-pulse",              color:"text-sky-500",    bg:"bg-sky-50"    },
  { value:"ecg",            label:"ECG / EKG",         icon:"ti ti-heart-rate-monitor", color:"text-teal-600",   bg:"bg-teal-50"   },
  { value:"pathology",      label:"Pathology",         icon:"fa-solid fa-microscope",   color:"text-emerald-600",bg:"bg-emerald-50"},
  { value:"prescription",   label:"Prescription",      icon:"bx bx-capsule",            color:"text-amber-600",  bg:"bg-amber-50"  },
  { value:"vaccination",    label:"Vaccination",       icon:"fa-solid fa-syringe",      color:"text-green-600",  bg:"bg-green-50"  },
  { value:"dental",         label:"Dental",            icon:"fa-solid fa-tooth",        color:"text-slate-600",  bg:"bg-slate-100" },
  { value:"eye_test",       label:"Eye Test",          icon:"ti ti-eye",                color:"text-blue-600",   bg:"bg-blue-50"   },
  { value:"thyroid",        label:"Thyroid",           icon:"ti ti-butterfly",          color:"text-pink-600",   bg:"bg-pink-50"   },
  { value:"liver_function", label:"Liver Function",    icon:"bx bx-body",               color:"text-orange-600", bg:"bg-orange-50" },
  { value:"kidney_function",label:"Kidney Function",   icon:"fa-solid fa-kidneys",      color:"text-yellow-700", bg:"bg-yellow-50" },
  { value:"lipid_profile",  label:"Lipid Profile",     icon:"ti ti-flask",              color:"text-violet-600", bg:"bg-violet-50" },
  { value:"diabetes",       label:"Diabetes / HbA1c",  icon:"bx bx-stats",              color:"text-rose-600",   bg:"bg-rose-50"   },
  { value:"allergy_test",   label:"Allergy Test",      icon:"fa-solid fa-leaf",         color:"text-lime-600",   bg:"bg-lime-50"   },
  { value:"other",          label:"Other",             icon:"bx bx-file",               color:"text-gray-500",   bg:"bg-gray-100"  },
];
export const STATUS_CONFIG = {
  normal:  { label:"Normal",   cls:"badge-ok",     icon:"ti ti-circle-check"   },
  abnormal:{ label:"Abnormal", cls:"badge-warn",   icon:"ti ti-alert-triangle" },
  critical:{ label:"Critical", cls:"badge-danger", icon:"ti ti-alert-octagon"  },
  pending: { label:"Pending",  cls:"badge-amber",  icon:"ti ti-clock"          },
};
export const getRT = (v) => REPORT_TYPES.find(t => t.value === v) || REPORT_TYPES.at(-1);
