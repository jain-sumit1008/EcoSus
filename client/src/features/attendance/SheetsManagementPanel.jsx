import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit3, CheckCircle2, ShieldCheck, Download, Search, Filter } from "lucide-react";
import * as sheetsApi from "../../api/sheets.api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";

export default function SheetsManagementPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [sheets, setSheets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterBlock, setFilterBlock] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "paper",
    sheetNumber: "",
    title: "",
    department: "Computer Science",
    block: "A",
    studentCount: 30,
    presentCount: 28,
    absentCount: 2,
    sheetsUsed: 1,
    sheetsAvoided: 30,
    notes: "",
  });

  const canEdit = ["admin", "faculty"].includes(user?.role);
  const canDelete = user?.role === "admin";

  const fetchSheetsData = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        sheetsApi.listSheets({
          type: filterType || undefined,
          block: filterBlock || undefined,
        }),
        sheetsApi.getSheetSummary(),
      ]);
      setSheets(listRes.data.items || []);
      setSummary(sumRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load muster sheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetsData();
  }, [filterType, filterBlock]);

  const handleOpenCreate = (type = "paper") => {
    setEditingSheet(null);
    setFormData({
      type,
      sheetNumber: "",
      title: type === "paper" ? "Physical Classroom Muster" : "Digital Session Muster",
      department: "Computer Science",
      block: "A",
      studentCount: 32,
      presentCount: 30,
      absentCount: 2,
      sheetsUsed: type === "paper" ? 2 : 0,
      sheetsAvoided: type === "digital" ? 32 : 0,
      notes: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sheet) => {
    setEditingSheet(sheet);
    setFormData({
      type: sheet.type,
      sheetNumber: sheet.sheetNumber,
      title: sheet.title,
      department: sheet.department,
      block: sheet.block,
      studentCount: sheet.studentCount,
      presentCount: sheet.presentCount,
      absentCount: sheet.absentCount,
      sheetsUsed: sheet.sheetsUsed || 0,
      sheetsAvoided: sheet.sheetsAvoided || 0,
      notes: sheet.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSheet) {
        await sheetsApi.updateSheet(editingSheet._id, formData);
        toast.success(`Sheet ${formData.sheetNumber || ""} updated successfully`);
      } else {
        await sheetsApi.createSheet(formData);
        toast.success(`New ${formData.type.toUpperCase()} muster sheet record added`);
      }
      setModalOpen(false);
      fetchSheetsData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save sheet record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, sheetNum) => {
    if (!window.confirm(`Are you sure you want to permanently delete muster record ${sheetNum}?`)) {
      return;
    }
    try {
      await sheetsApi.deleteSheet(id);
      toast.success(`Sheet record ${sheetNum} deleted`);
      fetchSheetsData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete sheet");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip: Paper vs Digital Impact */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Digital Sheets Avoided</p>
          <p className="text-2xl font-extrabold text-[#176B45] mt-1">
            {summary?.totalDigitalSheetsAvoided || 0}
          </p>
          <p className="text-[11px] text-muted mt-0.5">Sheets of physical paper conserved</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Paper Muster Used</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {summary?.totalPaperSheetsUsed || 0}
          </p>
          <p className="text-[11px] text-muted mt-0.5">Physical ledger pages consumed</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Net Saved Sheets</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summary?.netPaperSaved || 0}
          </p>
          <p className="text-[11px] text-muted mt-0.5">Net avoided vs legacy registers</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-muted font-medium">Equivalent Reams Avoided</p>
          <p className="text-2xl font-extrabold text-[#2585D8] mt-1">
            {summary?.estimatedReamsAvoided || "0.00"}
          </p>
          <p className="text-[11px] text-muted mt-0.5">Standard 500-sheet paper reams</p>
        </div>
      </div>

      {/* Action Controls & Filtering Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink">Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-line bg-page px-3 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">All Muster Types</option>
            <option value="paper">Paper Registers (Physical)</option>
            <option value="digital">Digital Sessions (Paperless)</option>
          </select>

          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="rounded-xl border border-line bg-page px-3 py-1.5 text-xs text-ink outline-none"
          >
            <option value="">All Campus Blocks</option>
            <option value="A">Block A</option>
            <option value="B">Block B</option>
            <option value="C">Block C</option>
            <option value="D">Block D</option>
            <option value="E">Block E</option>
          </select>
        </div>

        {/* Action Buttons for Authorized Roles */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreate("paper")}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log Paper Register</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreate("digital")}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Digital Sheet</span>
            </button>
          </div>
        )}
      </div>

      {/* Sheets Records Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h4 className="font-bold text-ink text-sm">Attendance Muster Sheets Archive</h4>
            <p className="text-xs text-muted">Comparison of physical register pages and paperless sessions</p>
          </div>
          <span className="text-xs font-semibold text-muted">{sheets.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-page text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-bold">Type</th>
                <th className="py-2.5 px-4 font-bold">Sheet #</th>
                <th className="py-2.5 px-4 font-bold">Title & Course</th>
                <th className="py-2.5 px-4 font-bold">Block / Dept</th>
                <th className="py-2.5 px-4 font-bold text-center">Attendance</th>
                <th className="py-2.5 px-4 font-bold text-center">Paper Metric</th>
                <th className="py-2.5 px-4 font-bold">Entered By</th>
                {canEdit && <th className="py-2.5 px-4 font-bold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-muted">
                    Loading muster records...
                  </td>
                </tr>
              ) : sheets.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-muted">
                    No muster sheets found for this filter.
                  </td>
                </tr>
              ) : (
                sheets.map((sheet) => {
                  const isPaper = sheet.type === "paper";
                  return (
                    <tr key={sheet._id} className="hover:bg-mint/30 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaper
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-[#176B45] border border-emerald-300"
                          }`}
                        >
                          {isPaper ? "Paper Register" : "Digital Muster"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-ink">{sheet.sheetNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-ink">{sheet.title}</p>
                        {sheet.notes && <p className="text-[10px] text-muted line-clamp-1">{sheet.notes}</p>}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        <span className="font-medium text-ink">Block {sheet.block}</span> · {sheet.department}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#238B57]">{sheet.presentCount} P</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="font-semibold text-error">{sheet.absentCount} A</span>
                        <span className="text-[10px] text-muted ml-1">({sheet.studentCount} total)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPaper ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {sheet.sheetsUsed} Used
                          </span>
                        ) : (
                          <span className="font-bold text-[#176B45] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{sheet.sheetsAvoided} Avoided
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {sheet.enteredBy?.name || "Faculty Desk"}
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sheet)}
                              className="rounded-lg p-1 text-muted hover:bg-page hover:text-ink transition"
                              title="Edit Sheet"
                            >
                              <Edit3 size={14} />
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(sheet._id, sheet.sheetNumber)}
                                className="rounded-lg p-1 text-error hover:bg-red-50 transition"
                                title="Delete Sheet"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h4 className="font-bold text-ink">
                  {editingSheet ? `Edit Sheet ${formData.sheetNumber}` : `Add ${formData.type === "paper" ? "Physical Paper Register" : "Digital Muster Sheet"}`}
                </h4>
                <p className="text-xs text-muted">Muster audit records for SVVV departmental archives</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-ink text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Muster Type</label>
                  <select
                    value={formData.type}
                    disabled={!!editingSheet}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  >
                    <option value="paper">Paper Register (Physical)</option>
                    <option value="digital">Digital Session (Paperless)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Sheet Identifier # (Optional)</label>
                  <input
                    type="text"
                    placeholder={formData.type === "paper" ? "e.g. PS-2024-0005" : "e.g. DS-2024-0005"}
                    value={formData.sheetNumber}
                    onChange={(e) => setFormData({ ...formData, sheetNumber: e.target.value })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Title / Course Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA-401 Computer Networks Muster"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-ink mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Campus Block</label>
                  <select
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  >
                    {["A", "B", "C", "D", "E"].map((b) => (
                      <option key={b} value={b}>
                        Block {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Total Students</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Present Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.presentCount}
                    onChange={(e) => setFormData({ ...formData, presentCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Absent Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.absentCount}
                    onChange={(e) => setFormData({ ...formData, absentCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  {formData.type === "paper" ? "Physical Paper Sheets Used" : "Estimated Paper Sheets Avoided"}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.type === "paper" ? formData.sheetsUsed : formData.sheetsAvoided}
                  onChange={(e) =>
                    formData.type === "paper"
                      ? setFormData({ ...formData, sheetsUsed: Number(e.target.value) })
                      : setFormData({ ...formData, sheetsAvoided: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Notes / Physical Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Physical muster filed in CS Dept Room A-102"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-line bg-page p-2 text-xs text-ink outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? "Saving..." : editingSheet ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
