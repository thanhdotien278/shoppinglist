import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, Loader2, CheckCircle } from "lucide-react";
import { dbService } from "../firebase/dbService";

export default function ExcelImporter({ userId, onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage("Đang tải dữ liệu...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          throw new Error("Tệp Excel rỗng hoặc không đúng định dạng!");
        }

        // Header row is index 0
        const headers = jsonData[0].map(h => String(h || "").trim().toUpperCase());

        // Resilient headers lookup
        const getIndex = (aliases) => {
          return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
        };

        const idxStt = getIndex(["STT", "NO"]);
        const idxName = getIndex(["TÊN", "PRODUCT", "ITEMS", "NAME", "SẢN PHẨM"]);
        const idxPrice = getIndex(["GIÁ", "PRICE", "THAM CHIẾU"]);
        const idxQty = getIndex(["SỐ LƯỢNG", "QTY", "QUANTITY", "SL"]);
        const idxNotes = getIndex(["GHI CHÚ", "NOTE", "DESCRIPTION"]);
        const idxAlt = getIndex(["SẢN PHẨM THAY THẾ", "ALT", "REPLACEMENT", "THAY THẾ"]);

        if (idxName === -1) {
          throw new Error("Không tìm thấy cột Tên Sản Phẩm!");
        }

        const parsedItems = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[idxName]) continue;

          // Normalize prices: "2.200" or "2,200" -> 2200
          const cleanNumber = (val) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === "number") return val;
            const cleanStr = String(val).replace(/\./g, "").replace(/,/g, "").trim();
            const num = parseFloat(cleanStr);
            return isNaN(num) ? 0 : num;
          };

          const item = {
            stt: idxStt !== -1 && row[idxStt] ? parseInt(row[idxStt]) : i,
            name: String(row[idxName]).trim(),
            referencePrice: idxPrice !== -1 ? cleanNumber(row[idxPrice]) : 0,
            actualPrice: idxPrice !== -1 ? cleanNumber(row[idxPrice]) : 0,
            quantity: idxQty !== -1 ? parseInt(row[idxQty]) || 1 : 1,
            notes: idxNotes !== -1 && row[idxNotes] ? String(row[idxNotes]).trim() : "",
            alternative: idxAlt !== -1 && row[idxAlt] ? String(row[idxAlt]).trim() : "",
            purchased: false,
            imageUrl: ""
          };
          parsedItems.push(item);
        }

        if (parsedItems.length === 0) {
          throw new Error("Không trích xuất được dòng dữ liệu hợp lệ nào!");
        }

        await dbService.importItems(userId, parsedItems);
        setMessage(`Đã nạp ${parsedItems.length} sản phẩm thành công!`);
        setTimeout(() => setMessage(""), 3000);
        onImportSuccess();
      } catch (err) {
        console.error("Excel processing failed: ", err);
        setMessage(`Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        style={{ display: "none" }}
      />
      <button 
        onClick={handleImportClick}
        disabled={loading}
        className="glass-card"
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          padding: "10px 16px", 
          border: "1px solid var(--border-glass)", 
          color: "#fff", 
          fontWeight: "500", 
          fontSize: "0.9rem",
          cursor: "pointer", 
          borderRadius: "10px",
          background: "rgba(59, 130, 246, 0.1)"
        }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} color="#3b82f6" />}
        {loading ? "Đang xử lý..." : "Nạp File Excel"}
      </button>

      {message && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          background: "rgba(16, 185, 129, 0.1)", 
          border: "1px solid rgba(16, 185, 129, 0.2)",
          color: "#6ee7b7", 
          padding: "8px 12px", 
          borderRadius: "10px", 
          fontSize: "0.85rem" 
        }}>
          <CheckCircle size={16} />
          {message}
        </div>
      )}
    </div>
  );
}
