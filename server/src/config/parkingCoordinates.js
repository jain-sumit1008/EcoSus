/**
 * SVVV Campus Parking Coordinates & Gate Configuration
 * Centralized, configurable coordinates for Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore.
 * Note: Uses configurable placeholders until exact surveyor coordinates are supplied.
 */
export const SVVV_PARKING_CONFIG = {
  campus: {
    name: "Shri Vaishnav Vidyapeeth Vishwavidyalaya",
    location: "Ujjain Road, Indore, Madhya Pradesh 453111",
    center: { lat: 22.8242, lng: 75.8344 },
  },
  gates: [
    {
      id: "gate-1",
      name: "Main Gate 1 (Primary Entrance)",
      coordinates: { lat: 22.8235, lng: 75.834 },
      nearestBlocks: ["A", "E"],
    },
    {
      id: "gate-2",
      name: "North Gate 2 (Hostel & Sports Side)",
      coordinates: { lat: 22.825, lng: 75.835 },
      nearestBlocks: ["C", "D"],
    },
  ],
  blocks: {
    A: {
      name: "Block A - Faculty Parking",
      region: "faculty",
      description: "Dedicated parking near Administrative & CS Academic Block",
      coordinates: { lat: 22.824, lng: 75.8338 },
      totalSpaces: 30,
      prefix: "A",
      nearestGate: "Main Gate 1",
    },
    B: {
      name: "Block B - Faculty & Staff",
      region: "faculty",
      description: "Faculty & senior administrative staff parking near Central Library",
      coordinates: { lat: 22.8245, lng: 75.8342 },
      totalSpaces: 40,
      prefix: "B",
      nearestGate: "Main Gate 1",
    },
    C: {
      name: "Block C - Student Parking North",
      region: "student",
      description: "Student parking for two-wheelers and four-wheelers near Science block",
      coordinates: { lat: 22.8248, lng: 75.8349 },
      totalSpaces: 50,
      prefix: "C",
      nearestGate: "North Gate 2",
    },
    D: {
      name: "Block D - Student Parking South",
      region: "student",
      description: "Student parking near Sports Complex & Auditorium",
      coordinates: { lat: 22.8238, lng: 75.8346 },
      totalSpaces: 60,
      prefix: "D",
      nearestGate: "North Gate 2",
    },
    E: {
      name: "Block E - General & Visitors",
      region: "general",
      description: "General parking for campus visitors, parents, and temporary permits",
      coordinates: { lat: 22.8234, lng: 75.8335 },
      totalSpaces: 40,
      prefix: "E",
      nearestGate: "Main Gate 1",
    },
  },
};
