import { Wallet, CheckSquare, TrendingDown } from "lucide-react";

export default function SpendingSummary({ items }) {
  const totalItems = items.length;
  const purchasedItems = items.filter(it => it.purchased).length;
  const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const totalEstimate = items.reduce((acc, it) => acc + (it.referencePrice * it.quantity), 0);
  const totalActual = items.reduce((acc, it) => acc + (it.purchased ? (it.actualPrice * it.quantity) : 0), 0);

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  return (
    <div className="glass-card glow-blue" style={{ 
      padding: "1.5rem", 
      marginBottom: "1.5rem", 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
      gap: "1.5rem" 
    }}>
      
      {/* Progress Tracker */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ 
          width: "56px", 
          height: "56px", 
          borderRadius: "50%", 
          background: "rgba(59, 130, 246, 0.1)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <CheckSquare size={26} color="#3b82f6" />
        </div>
        <div style={{ flexGrow: 1 }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tiến Độ Mua</p>
          <h3 style={{ fontSize: "1.35rem", fontWeight: "700", marginTop: "2px" }}>
            {purchasedItems}/{totalItems} <span style={{ fontSize: "0.9rem", color: "var(--color-success)", fontWeight: "600" }}>({progressPercent}%)</span>
          </h3>
          <div style={{ width: "100%", height: "6px", background: "var(--bg-inner)", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--color-primary)", borderRadius: "3px", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
          </div>
        </div>
      </div>

      {/* Budget Plan */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ 
          width: "56px", 
          height: "56px", 
          borderRadius: "50%", 
          background: "rgba(245, 158, 11, 0.1)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Wallet size={26} color="#f59e0b" />
        </div>
        <div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Dự kiến Chi (Excel)</p>
          <h3 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#f59e0b", marginTop: "2px" }}>{formatVND(totalEstimate)}</h3>
        </div>
      </div>

      {/* Actual Expenditure */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ 
          width: "56px", 
          height: "56px", 
          borderRadius: "50%", 
          background: "rgba(16, 185, 129, 0.1)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <TrendingDown size={26} color="#10b981" />
        </div>
        <div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thực tế đã Chi</p>
          <h3 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#10b981", marginTop: "2px" }}>{formatVND(totalActual)}</h3>
        </div>
      </div>
    </div>
  );
}
