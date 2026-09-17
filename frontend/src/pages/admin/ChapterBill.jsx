import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { FileSpreadsheet, Printer, Save, Receipt } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx";

const COMPANY_NAME = "EDIFYEIGHT";

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n) {
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`;
}

// Indian numbering system: crore / lakh / thousand / hundred.
function numberToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  return parts.join(" ");
}

function formatDate(d) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export default function ChapterBill() {
  const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const isAdmin = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return String(user?.role || "").toLowerCase() === "admin";
    } catch {
      return false;
    }
  })();

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    "Content-Type": "application/json",
  });

  const [teachers, setTeachers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");

  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [billTo, setBillTo] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branch, setBranch] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [tRes, pRes] = await Promise.all([
          fetch(`${API}/api/users/teachers`, { headers: headers() }),
          fetch(`${API}/api/topic-payments?limit=500`, { headers: headers() }),
        ]);
        const tData = await tRes.json().catch(() => ({}));
        setTeachers(Array.isArray(tData?.teachers) ? tData.teachers : []);
        const pData = await pRes.json().catch(() => ({}));
        setTopics(Array.isArray(pData?.items) ? pData.items : []);
      } catch {
        toast.error("Failed to load teachers or chapters");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t._id === teacherId) || null,
    [teachers, teacherId]
  );

  useEffect(() => {
    if (!selectedTeacher) {
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setBranch("");
      return;
    }
    setBankName(selectedTeacher.bankDetails?.bankName || "");
    setAccountNumber(selectedTeacher.bankDetails?.accountNumber || "");
    setIfscCode(selectedTeacher.bankDetails?.ifscCode || "");
    setBranch(selectedTeacher.bankDetails?.branch || "");
  }, [selectedTeacher]);

  // Only chapters this teacher wrote whose content AND questions are both
  // approved — i.e. successfully uploaded and reviewed — belong on the bill.
  const approvedChapters = useMemo(() => {
    if (!teacherId) return [];
    return topics
      .filter((t) => t.createdBy?._id === teacherId && t.contentDone && t.questionsDone)
      .sort((a, b) => {
        const classCompare = String(a.class?.name || "").localeCompare(String(b.class?.name || ""), undefined, { numeric: true });
        if (classCompare !== 0) return classCompare;
        return String(a.subject?.name || "").localeCompare(String(b.subject?.name || ""));
      });
  }, [topics, teacherId]);

  const grandTotal = useMemo(
    () => approvedChapters.reduce((sum, t) => sum + (Number(t.budgetAmount) || 0), 0),
    [approvedChapters]
  );

  // rowSpan for merging the Class column across consecutive rows sharing a class
  const rowsWithSpan = useMemo(() => {
    return approvedChapters.map((t, i) => {
      const className = t.class?.name || "N/A";
      const prevClass = i > 0 ? (approvedChapters[i - 1].class?.name || "N/A") : null;
      if (className === prevClass) return { ...t, _showClass: false, _classSpan: 0 };
      let span = 1;
      for (let j = i + 1; j < approvedChapters.length; j++) {
        if ((approvedChapters[j].class?.name || "N/A") === className) span++;
        else break;
      }
      return { ...t, _showClass: true, _classSpan: span };
    });
  }, [approvedChapters]);

  async function saveBankDetails() {
    if (!teacherId) return;
    setSavingBank(true);
    try {
      const res = await fetch(`${API}/api/users/teachers/${teacherId}/bank-details`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ bankName, accountNumber, ifscCode, branch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save bank details");
      setTeachers((prev) => prev.map((t) => (t._id === teacherId ? data.teacher : t)));
      toast.success("Bank details saved");
    } catch (err) {
      toast.error(err?.message || "Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  }

  function exportToExcel() {
    if (!selectedTeacher || approvedChapters.length === 0) {
      toast.warn("Select a teacher with approved chapters first");
      return;
    }

    const aoa = [];
    const merges = [];
    const COLS = 5; // Sl.No, Subject, Class, Subject/Chapter Details, Amount

    const pushMergedRow = (text) => {
      const r = aoa.length;
      aoa.push([text, "", "", "", ""]);
      merges.push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });
    };
    const pushLabelValueRow = (label, value) => {
      const r = aoa.length;
      aoa.push([label, value, "", "", ""]);
      merges.push({ s: { r, c: 1 }, e: { r, c: COLS - 1 } });
    };

    pushMergedRow(`BILL OF CONTENTS FOR ${COMPANY_NAME}`);
    pushMergedRow(`Bill Date:${formatDate(billDate)}`);
    pushLabelValueRow("From :", selectedTeacher.name || "");
    pushLabelValueRow("Bank Name:", bankName);
    pushLabelValueRow("Account Number:", accountNumber);
    pushLabelValueRow("IFSC Code:", ifscCode);
    pushLabelValueRow("Branch:", branch);
    pushLabelValueRow("To :", billTo);
    pushMergedRow(`Bill for Contents written and delivered to ${COMPANY_NAME}`);

    aoa.push(["Sl.No", "Subject", "Class", "Subject / Chapter Details", "Amount"]);

    rowsWithSpan.forEach((t, i) => {
      const r = aoa.length;
      aoa.push([
        i + 1,
        t.subject?.name || "N/A",
        t._showClass ? (t.class?.name || "N/A") : "",
        t.name,
        Number(t.budgetAmount) || 0,
      ]);
      if (t._showClass && t._classSpan > 1) {
        merges.push({ s: { r, c: 2 }, e: { r: r + t._classSpan - 1, c: 2 } });
      }
    });

    const totalRow = aoa.length;
    aoa.push(["", "", "", "GRAND TOTAL AMOUNT", grandTotal]);
    merges.push({ s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 3 } });

    const wordsRow = aoa.length;
    aoa.push(["In words:", `(Rupees ${numberToWords(grandTotal)} only)`, "", "", ""]);
    merges.push({ s: { r: wordsRow, c: 1 }, e: { r: wordsRow, c: COLS - 1 } });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!merges"] = merges;
    worksheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 42 }, { wch: 14 }];
    worksheet["!rows"] = aoa.map((_, i) => (i === 0 ? { hpt: 22 } : undefined));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bill");

    const filename = `Bill_of_Contents_${(selectedTeacher.name || "teacher").replace(/\s+/g, "_")}_${billDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 print:p-0 print:max-w-none">
      <ToastContainer />

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white shadow">
            <Receipt className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Generate Content Bill</h1>
            <p className="text-sm text-indigo-700">
              Auto-build a bill of contents for a teacher's approved, uploaded chapters
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 print:hidden">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border-2 border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Bill Date</label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full border-2 border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">To (recipient)</label>
            <input
              value={billTo}
              onChange={(e) => setBillTo(e.target.value)}
              placeholder="e.g. College of Fashion, Kolkata"
              className="w-full border-2 border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {teacherId && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">Payout Bank Details for {selectedTeacher?.name}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="border-2 border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              />
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="border-2 border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              />
              <input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder="IFSC Code"
                className="border-2 border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              />
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch"
                className="border-2 border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={saveBankDetails}
              disabled={savingBank}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {savingBank ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={!teacherId || approvedChapters.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!teacherId || approvedChapters.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* ---------- Bill Preview ---------- */}
      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading...</div>
      ) : !teacherId ? (
        <div className="p-6 text-center text-gray-500">Select a teacher to preview their bill.</div>
      ) : approvedChapters.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {selectedTeacher?.name} has no chapters with both content and questions approved yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden print:border-0 print:shadow-none">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr>
                <td colSpan={5} className="p-3 text-center text-lg font-bold bg-blue-100 border border-gray-300">
                  BILL OF CONTENTS FOR {COMPANY_NAME}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="p-2 text-center font-semibold bg-blue-50 border border-gray-300">
                  Bill Date:{formatDate(billDate)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300 w-40">From :</td>
                <td colSpan={4} className="p-2 border border-gray-300">{selectedTeacher?.name}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300">Bank Name:</td>
                <td colSpan={4} className="p-2 border border-gray-300">{bankName || "—"}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300">Account Number:</td>
                <td colSpan={4} className="p-2 border border-gray-300">{accountNumber || "—"}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300">IFSC Code:</td>
                <td colSpan={4} className="p-2 border border-gray-300">{ifscCode || "—"}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300">Branch:</td>
                <td colSpan={4} className="p-2 border border-gray-300">{branch || "—"}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border border-gray-300">To :</td>
                <td colSpan={4} className="p-2 border border-gray-300">{billTo || "—"}</td>
              </tr>
              <tr>
                <td colSpan={5} className="p-2 text-center font-semibold bg-emerald-50 border border-gray-300">
                  Bill for Contents written and delivered to {COMPANY_NAME}
                </td>
              </tr>
              <tr className="bg-emerald-100">
                <th className="p-2 border border-gray-300">Sl.No</th>
                <th className="p-2 border border-gray-300">Subject</th>
                <th className="p-2 border border-gray-300">Class</th>
                <th className="p-2 border border-gray-300">Subject / Chapter Details</th>
                <th className="p-2 border border-gray-300">Amount</th>
              </tr>
              {rowsWithSpan.map((t, i) => (
                <tr key={t._id}>
                  <td className="p-2 text-center border border-gray-300">{i + 1}</td>
                  <td className="p-2 text-center font-medium text-indigo-700 border border-gray-300">{t.subject?.name || "N/A"}</td>
                  {t._showClass && (
                    <td
                      rowSpan={t._classSpan}
                      className="p-2 text-center align-middle font-semibold border border-gray-300"
                    >
                      {t.class?.name || "N/A"}
                    </td>
                  )}
                  <td className="p-2 text-indigo-700 border border-gray-300">{t.name}</td>
                  <td className="p-2 text-center border border-gray-300">{Number(t.budgetAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-100 font-bold">
                <td colSpan={4} className="p-2 text-right border border-gray-300">GRAND TOTAL AMOUNT</td>
                <td className="p-2 text-center border border-gray-300">{grandTotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="p-2 font-semibold border border-gray-300">In words:</td>
                <td colSpan={4} className="p-2 border border-gray-300">
                  (Rupees {numberToWords(grandTotal)} only)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
