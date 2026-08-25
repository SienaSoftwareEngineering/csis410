// ============================================================
// Course Planning App — Default Data
// ============================================================

const TRACKS = {
  SD:  { name: "Software Development", color: "#2563eb" },
  GD:  { name: "Game Development",     color: "#7c3aed" },
  AI:  { name: "Artificial Intelligence", color: "#059669" },
  CY:  { name: "Cyber",                color: "#dc2626" },
  FD:  { name: "Foundations",          color: "#d97706" },
  IS:  { name: "Information Systems",  color: "#0891b2" },
  EN:  { name: "Entrepreneurial",      color: "#be185d" },
  ED:  { name: "CS Education",         color: "#4f46e5" },
  ADS: { name: "Applied Data Science", color: "#65a30d" },
  PDS: { name: "Pure Data Science",    color: "#0d9488" },
};

// Offering patterns:
//   semester: "every" | "fall" | "spring" | "both"
//   period: 1 = every year, 2 = every 2 years
//   startYear: for 2-yr rotations, first year offered

const DEFAULT_COURSES = {
  // ─── CS Kernel (every semester) ───────────────────────
  "CSIS-110": { name: "Intro to Computer Science", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: [] },
  "CSIS-120": { name: "Intro to Programming", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: ["CSIS-110"] },
  "CSIS-210": { name: "Data Structures", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: ["CSIS-120"] },

  // ─── Every Fall ───────────────────────────────────────
  "CSIS-251": { name: "Discrete Mathematics", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "fall", period: 1 }, prerequisites: ["MATH-120"] },
  "CSIS-411": { name: "Senior Seminar", credits: 1,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "fall", period: 1 }, prerequisites: [] },
  "CSIS-220": { name: "Assembly", credits: 4,
    tracks: ["ED","FD","CY"],
    offering: { semester: "fall", period: 1 }, prerequisites: ["CSIS-120"] },
  "MATH-250": { name: "Linear Algebra / Discrete", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "fall", period: 1 }, prerequisites: ["MATH-120"] },

  // ─── Every Spring ─────────────────────────────────────
  "CSIS-225": { name: "Computer Organization", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["CSIS-210"] },
  "CSIS-385": { name: "Analysis of Algorithms", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["CSIS-210","MATH-250"] },
  "CSIS-390": { name: "Web Application Development", credits: 3,
    tracks: ["SD","ED","EN","IS"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["CSIS-210"] },
  "CSIS-415": { name: "Software Engineering II", credits: 3,
    tracks: ["SD","EN","IS"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["CSIS-410"] },
  "CSIS-205": { name: "Intro to Cyber", credits: 3,
    tracks: ["CY"],
    offering: { semester: "spring", period: 1 }, prerequisites: [] },
  "MATH-351": { name: "Theory of Computation", credits: 3,
    tracks: ["ED","FD"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["CSIS-251"] },

  // ─── Every Year Both Semesters ────────────────────────
  "CSIS-350": { name: "Database", credits: 3,
    tracks: ["SD","EN","PDS","IS","CY","GD","ADS"],
    offering: { semester: "both", period: 1 }, prerequisites: ["CSIS-210"] },
  "CSIS-410": { name: "Software Engineering I", credits: 3,
    tracks: ["SD","EN","IS"],
    offering: { semester: "both", period: 1 }, prerequisites: ["CSIS-210"] },

  // ─── 2-Year Fall Rotation ─────────────────────────────
  "CSIS-365": { name: "Computer Networks", credits: 3,
    tracks: ["ED","IS","CY","GD"],
    offering: { semester: "fall", period: 2, startYear: 2023 }, prerequisites: ["CSIS-210"] },
  "CSIS-371": { name: "Info Retrieval", credits: 3,
    tracks: ["AI"],
    offering: { semester: "fall", period: 2, startYear: 2024 }, prerequisites: ["CSIS-210"] },
  "CSIS-370": { name: "Robotics", credits: 3,
    tracks: ["AI"],
    offering: { semester: "fall", period: 2, startYear: 2025 }, prerequisites: ["CSIS-210"] },
  "CSIS-335": { name: "Parallel Computing", credits: 3,
    tracks: ["GD"],
    offering: { semester: "fall", period: 2, startYear: 2023 }, prerequisites: ["CSIS-210"] },
  "CSIS-330": { name: "Operating Systems", credits: 3,
    tracks: ["CY","GD"],
    offering: { semester: "fall", period: 2, startYear: 2024 }, prerequisites: ["CSIS-210"] },
  "CSIS-301": { name: "C Programming in Unix", credits: 1,
    tracks: [],
    offering: { semester: "fall", period: 1 }, prerequisites: ["CSIS-210"] },
  "CSIS-306": { name: "Adv. Cyber", credits: 3,
    tracks: ["ED","IS","CY"],
    offering: { semester: "fall", period: 2, startYear: 2024 }, prerequisites: ["CSIS-205"] },
  "CSIS-400": { name: "Incident Response", credits: 3,
    tracks: ["CY"],
    offering: { semester: "fall", period: 2, startYear: 2025 }, prerequisites: ["CSIS-306"] },
  "CSIS-340": { name: "Programming Languages", credits: 3,
    tracks: [],
    offering: { semester: "fall", period: 2, startYear: 2023 }, prerequisites: ["CSIS-210"] },
  "CSIS-368": { name: "Enterprise Systems", credits: 3,
    tracks: ["IS"],
    offering: { semester: "fall", period: 2, startYear: 2027 }, prerequisites: ["CSIS-210"] },

  // ─── 2-Year Spring Rotation ───────────────────────────
  "CSIS-355": { name: "Adv. Database", credits: 3,
    tracks: ["IS","PDS"],
    offering: { semester: "spring", period: 2, startYear: 2024 }, prerequisites: ["CSIS-350"] },
  "CSIS-380": { name: "Graphics", credits: 3,
    tracks: ["GD"],
    offering: { semester: "spring", period: 2, startYear: 2024 }, prerequisites: ["CSIS-210"] },
  "CSIS-345": { name: "Game Development", credits: 3,
    tracks: ["GD"],
    offering: { semester: "spring", period: 2, startYear: 2025 }, prerequisites: ["CSIS-210"] },
  "CSIS-331": { name: "Mobile App", credits: 3,
    tracks: ["EN","IS"],
    offering: { semester: "spring", period: 2, startYear: 2024 }, prerequisites: ["CSIS-210"] },
  "CSIS-320": { name: "Machine Learning", credits: 3,
    tracks: ["AI","GD","ADS","PDS"],
    offering: { semester: "spring", period: 2, startYear: 2024 }, prerequisites: ["CSIS-210"] },
  "CSIS-375": { name: "Intro to AI", credits: 3,
    tracks: ["AI","GD"],
    offering: { semester: "spring", period: 2, startYear: 2025 }, prerequisites: ["CSIS-210"] },
  "CSIS-321": { name: "UX Design", credits: 3,
    tracks: [],
    offering: { semester: "spring", period: 2, startYear: 2025 }, prerequisites: [] },
  "CSIS-333": { name: "Unix/Linux", credits: 3,
    tracks: [],
    offering: { semester: "spring", period: 2, startYear: 2025 }, prerequisites: [] },
  "CSIS-310": { name: "Numerical Methods", credits: 3,
    tracks: [],
    offering: { semester: "spring", period: 2, startYear: 2026 }, prerequisites: ["CSIS-210"] },
  "CSIS-200": { name: "MTX / Trauma Informed UX", credits: 3,
    tracks: [],
    offering: { semester: "spring", period: 2, startYear: 2026 }, prerequisites: [] },

  // ─── Math / BAAS Sequence ─────────────────────────────
  "MATH-110": { name: "Calculus I", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: [] },
  "MATH-120": { name: "Calculus II", credits: 4,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: ["MATH-110"] },
  "MATH-275": { name: "Probability & Statistics", credits: 3,
    tracks: ["FD"],
    offering: { semester: "every", period: 1 }, prerequisites: ["MATH-120"] },
  "MATH-350": { name: "Abstract Algebra", credits: 3,
    tracks: ["FD"],
    offering: { semester: "spring", period: 1 }, prerequisites: ["MATH-250"] },
  "MATH-101": { name: "Math Concepts", credits: 3,
    tracks: [],
    offering: { semester: "every", period: 1 }, prerequisites: [] },
  "BAAS-130": { name: "BAAS Statistics I", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: [] },
  "BAAS-140": { name: "BAAS Statistics II", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: ["BAAS-130"] },
  "BAAS-200": { name: "BAAS Research Methods", credits: 3,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED","ADS","PDS"],
    offering: { semester: "every", period: 1 }, prerequisites: ["BAAS-140"] },
  "BAAS-210": { name: "BAAS Applied Analytics", credits: 3,
    tracks: [],
    offering: { semester: "every", period: 1 }, prerequisites: ["BAAS-140"] },
  "CSIS-011": { name: "CS Orientation", credits: 1,
    tracks: ["SD","GD","AI","CY","FD","IS","EN","ED"],
    offering: { semester: "every", period: 1 }, prerequisites: [] },
};

const DEFAULT_DEPENDENCIES = [
  // CS core chain
  { from: "CSIS-110", to: "CSIS-120" },
  { from: "CSIS-120", to: "CSIS-210" },
  { from: "CSIS-210", to: "CSIS-225" },
  { from: "CSIS-210", to: "CSIS-385" },
  { from: "MATH-250",  to: "CSIS-385" },
  { from: "CSIS-210", to: "CSIS-350" },
  { from: "CSIS-210", to: "CSIS-410" },
  { from: "CSIS-410", to: "CSIS-415" },
  { from: "CSIS-210", to: "CSIS-390" },
  { from: "CSIS-210", to: "CSIS-365" },
  { from: "CSIS-210", to: "CSIS-335" },
  { from: "CSIS-210", to: "CSIS-330" },
  { from: "CSIS-210", to: "CSIS-380" },
  { from: "CSIS-210", to: "CSIS-345" },
  { from: "CSIS-210", to: "CSIS-331" },
  { from: "CSIS-210", to: "CSIS-320" },
  { from: "CSIS-210", to: "CSIS-375" },
  { from: "CSIS-210", to: "CSIS-340" },
  { from: "CSIS-210", to: "CSIS-371" },
  { from: "CSIS-210", to: "CSIS-370" },
  { from: "CSIS-210", to: "CSIS-310" },
  { from: "CSIS-210", to: "CSIS-301" },
  { from: "CSIS-120", to: "CSIS-220" },
  { from: "CSIS-350", to: "CSIS-355" },
  { from: "CSIS-205", to: "CSIS-306" },
  { from: "CSIS-306", to: "CSIS-400" },
  // Math chain
  { from: "MATH-110", to: "MATH-120" },
  { from: "MATH-120", to: "MATH-250" },
  { from: "MATH-120", to: "CSIS-251" },
  { from: "CSIS-251", to: "MATH-351" },
  { from: "MATH-120", to: "MATH-275" },
  { from: "MATH-250", to: "MATH-350" },
  // BAAS chain
  { from: "BAAS-130", to: "BAAS-140" },
  { from: "BAAS-140", to: "BAAS-200" },
  { from: "BAAS-200", to: "MATH-250" },
  { from: "BAAS-140", to: "BAAS-210" },
];

function isOffered(course, semester) {
  const off = course.offering;
  if (!off) return true;
  if (off.semester === "every" || off.semester === "both") return true;
  if (off.semester === "fall"   && semester.type !== "fall")   return false;
  if (off.semester === "spring" && semester.type !== "spring") return false;
  if (off.period === 2 && off.startYear != null) {
    return (semester.year - off.startYear) % 2 === 0;
  }
  return true;
}

function generateSemesters(startYear, endYear) {
  const semesters = [];
  for (let y = startYear; y <= endYear; y++) {
    semesters.push({ id: `fall-${y}`,     label: `Fall ${y}`,     type: "fall",   year: y });
    semesters.push({ id: `spring-${y+1}`, label: `Spring ${y+1}`, type: "spring", year: y+1 });
  }
  return semesters;
}

function getOfferingText(course) {
  const off = course.offering;
  if (!off) return "";
  if (off.semester === "every") return "Every semester";
  if (off.semester === "both")  return "Every year (F+Sp)";
  const s = off.semester === "fall" ? "Fall" : "Spring";
  if (off.period === 1) return `Every ${s}`;
  return `Every 2 yrs (${s}, from ${off.startYear})`;
}
