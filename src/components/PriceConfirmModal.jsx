import { useState } from "react";
import { Check, X, ShieldAlert } from "lucide-react";

export default function PriceConfirmModal({ isOpen, item, onConfirm, onCancel }) {
  const [price, setPrice] = useState(() => 
    item?.referencePrice !== undefined ? String(item.referencePrice) : "0"
  );

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price.replace(/\./g, "").replace(/,/g, "").trim());
    onConfirm(isNaN(parsedPrice) ? 0 : parsedPrice);
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "var(--bg-scrim)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
    }}>
      <div 
        className="glass-card animate-slide glow-blue" 
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem 1.5rem",
          position: "relative",
          border: "1px solid var(--border-glass)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem auto"
          }}>
            <ShieldAlert size={28} color="#10b981" />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Xác nhận Giá mua thực tế</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Sản phẩm: <span style={{ color: "var(--color-text-main)", fontWeight: "600" }}>{item.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "var(--bg-inner)", border: "1px solid var(--border-glass)", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Giá gốc tham chiếu:</span>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-warning)" }}>
              {formatVND(item.referencePrice)}
            </span>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "500" }}>
              Giá mua thực tế (VND):
            </label>
            <input 
              type="text" 
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Nhập giá mua..." 
              autoFocus
              onFocus={(e) => e.target.select()}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "10px",
                color: "var(--color-text-main)",
                outline: "none",
                fontSize: "1.1rem",
                fontWeight: "600",
                textAlign: "center"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "0.5rem" }}>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-glass)",
                borderRadius: "10px",
                color: "var(--color-text-muted)",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <X size={18} />
              Hủy
            </button>
            <button 
              type="submit" 
              style={{
                flex: 1,
                padding: "12px",
                background: "var(--color-success)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Check size={18} />
              Đã Mua
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
