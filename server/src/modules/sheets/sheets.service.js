import { SheetRecord } from "../../models/SheetRecord.js";
import { ApiError } from "../../utils/ApiError.js";
import { writeAudit } from "../../models/AuditLog.js";

export async function listSheets({ type, block, department, from, to, page = 1, limit = 50 }) {
  const filter = {};
  if (type) filter.type = type;
  if (block) filter.block = block;
  if (department) filter.department = department;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    SheetRecord.find(filter)
      .populate("enteredBy", "name email role department")
      .populate("sessionRef", "subjectName subjectCode classroom")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    SheetRecord.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getSheetSummary() {
  const allSheets = await SheetRecord.find({}).lean();
  let totalPaperSheetsUsed = 0;
  let totalDigitalSheetsAvoided = 0;
  let paperRecordsCount = 0;
  let digitalRecordsCount = 0;

  for (const s of allSheets) {
    if (s.type === "paper") {
      totalPaperSheetsUsed += s.sheetsUsed || 0;
      paperRecordsCount++;
    } else if (s.type === "digital") {
      totalDigitalSheetsAvoided += s.sheetsAvoided || 0;
      digitalRecordsCount++;
    }
  }

  return {
    totalPaperSheetsUsed,
    totalDigitalSheetsAvoided,
    paperRecordsCount,
    digitalRecordsCount,
    netPaperSaved: Math.max(0, totalDigitalSheetsAvoided - totalPaperSheetsUsed),
    estimatedReamsAvoided: Number((totalDigitalSheetsAvoided / 500).toFixed(2)),
  };
}

export async function createSheet(payload, user) {
  const count = await SheetRecord.countDocuments({ type: payload.type });
  const prefix = payload.type === "paper" ? "PS" : "DS";
  const year = new Date().getFullYear();
  const sheetNumber = payload.sheetNumber || `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;

  const sheet = await SheetRecord.create({
    ...payload,
    sheetNumber,
    enteredBy: user._id,
  });

  await writeAudit({
    actor: user._id,
    action: "sheets.create",
    entityType: "SheetRecord",
    entityId: String(sheet._id),
    metadata: { type: sheet.type, sheetNumber: sheet.sheetNumber },
  });

  return sheet;
}

export async function updateSheet(id, payload, user) {
  const sheet = await SheetRecord.findById(id);
  if (!sheet) throw new ApiError(404, "Sheet record not found", "NOT_FOUND");

  Object.assign(sheet, payload);
  await sheet.save();

  await writeAudit({
    actor: user._id,
    action: "sheets.update",
    entityType: "SheetRecord",
    entityId: String(sheet._id),
  });

  return sheet;
}

export async function deleteSheet(id, user) {
  const sheet = await SheetRecord.findById(id);
  if (!sheet) throw new ApiError(404, "Sheet record not found", "NOT_FOUND");

  await SheetRecord.findByIdAndDelete(id);

  await writeAudit({
    actor: user._id,
    action: "sheets.delete",
    entityType: "SheetRecord",
    entityId: String(id),
  });

  return { id };
}
