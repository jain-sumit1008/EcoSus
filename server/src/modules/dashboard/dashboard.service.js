import { WaterReading } from "../../models/WaterReading.js";
import { ElectricityReading } from "../../models/ElectricityReading.js";
import { Alert } from "../../models/Alert.js";
import { AttendanceSession } from "../../models/AttendanceSession.js";
import { AttendanceRecord } from "../../models/AttendanceRecord.js";
import { ParkingArea } from "../../models/ParkingArea.js";
import { SustainabilityAction } from "../../models/SustainabilityAction.js";
import { electricityServiceEstimates } from "./helpers.js";
import { latestByBlock } from "../greenery/greenery.service.js";
import { paperFromSessions } from "../sustainability/helpers.js";
import { withFreshness } from "../parking/parking.service.js";
import { estimates } from "../electricity/electricity.service.js";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseRange(query) {
  const to = query.to ? endOfDay(query.to) : endOfDay(new Date());
  const from = query.from ? startOfDay(query.from) : startOfDay(new Date());
  return { from, to };
}

async function dailyTrend(Model, field, from, to) {
  return Model.aggregate([
    { $match: { recordedAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" } },
        value: { $sum: `$${field}` },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", value: 1 } },
  ]);
}

async function blockTotals(Model, field, from, to) {
  return Model.aggregate([
    { $match: { recordedAt: { $gte: from, $lte: to } } },
    { $group: { _id: "$block", value: { $sum: `$${field}` } } },
    { $project: { _id: 0, block: "$_id", value: 1 } },
    { $sort: { block: 1 } },
  ]);
}

export async function getSummary(query) {
  const { from, to } = parseRange(query);
  const weekFrom = new Date(to);
  weekFrom.setDate(weekFrom.getDate() - 6);
  weekFrom.setHours(0, 0, 0, 0);

  const [
    waterToday,
    waterWeek,
    waterTrend,
    waterBlocks,
    elecToday,
    elecWeek,
    elecTrend,
    elecBlocks,
    paper,
    openAlerts,
    recentAlerts,
    sessions,
    records,
    parking,
    greenery,
    recentActions,
  ] = await Promise.all([
    WaterReading.aggregate([
      { $match: { recordedAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$consumptionLitres" } } },
    ]),
    WaterReading.aggregate([
      { $match: { recordedAt: { $gte: weekFrom, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$consumptionLitres" } } },
    ]),
    dailyTrend(WaterReading, "consumptionLitres", weekFrom, to),
    blockTotals(WaterReading, "consumptionLitres", from, to),
    ElectricityReading.aggregate([
      { $match: { recordedAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$consumptionKwh" } } },
    ]),
    ElectricityReading.aggregate([
      { $match: { recordedAt: { $gte: weekFrom, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$consumptionKwh" } } },
    ]),
    dailyTrend(ElectricityReading, "consumptionKwh", weekFrom, to),
    blockTotals(ElectricityReading, "consumptionKwh", from, to),
    paperFromSessions(from, to),
    Alert.countDocuments({ status: { $in: ["open", "investigating"] } }),
    Alert.find().sort({ detectedAt: -1 }).limit(6).lean(),
    AttendanceSession.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    AttendanceRecord.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    ParkingArea.find().lean(),
    latestByBlock(),
    SustainabilityAction.find().sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const waterLitres = waterToday[0]?.total || 0;
  const elecKwh = elecToday[0]?.total || 0;
  const parkingFresh = parking.map(withFreshness);
  const parkingTotals = parkingFresh.reduce(
    (acc, area) => {
      acc.total += area.totalSpaces;
      acc.available += area.availableSpaces;
      acc.occupied += area.occupiedSpaces;
      acc.reserved += area.reservedSpaces;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, reserved: 0 }
  );

  return {
    range: { from, to, timezoneNote: "Timestamps are stored in UTC. Campus local time is Asia/Kolkata." },
    water: {
      todayLitres: waterLitres,
      weeklyAverageLitres: Number(((waterWeek[0]?.total || 0) / 7).toFixed(1)),
      unit: "L",
      convention: "interval_consumption",
      trend: waterTrend,
      byBlock: waterBlocks,
    },
    electricity: {
      todayKwh: elecKwh,
      weeklyAverageKwh: Number(((elecWeek[0]?.total || 0) / 7).toFixed(1)),
      ...estimates(elecKwh),
      trend: elecTrend,
      byBlock: elecBlocks,
    },
    paper,
    attendance: {
      sessionsInRange: sessions,
      recordsInRange: records,
    },
    parking: {
      ...parkingTotals,
      areas: parkingFresh,
      label: "Manually reported or simulated occupancy unless source is integrated.",
    },
    greenery: {
      averageCoveragePercent: greenery.average,
      targetPercent: greenery.targetPercent,
      blocks: greenery.blocks,
    },
    alerts: {
      openCount: openAlerts,
      recent: recentAlerts,
    },
    recentActions,
    dataQuality: {
      notes: [
        "Do not invent historical comparisons when a trend series has fewer than two points.",
        "Simulated demo records are labelled with source=simulated.",
        "Estimated savings are calculations, not verified intervention results.",
      ],
    },
  };
}

export { electricityServiceEstimates };
