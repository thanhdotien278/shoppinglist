import { LogOut, ShoppingBag, Sun, Moon } from "lucide-react";
import ExcelImporter from "./ExcelImporter";
import { supabase, isSupabaseConfigured } from "../supabase/config";

export default function Header({ user, onLogout, onImportSuccess, theme, onToggleTheme }) {
  
  const handleLogoutClick = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase sign out failed:", err);
      }
    }
    onLogout();
  };

  return (
    <header className="glass-card" style={{
      padding: "1rem 1.25rem",
      marginBottom: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      borderBottomLeftRadius: "16px",
      borderBottomRightRadius: "16px",
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
      borderTop: "none"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            background: "rgba(59, 130, 246, 0.15)",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShoppingBag size={20} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "700", letterSpacing: "-0.5px", color: "var(--color-text-main)" }}>Shopping List</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ 
            fontSize: "0.8rem", 
            color: "var(--color-text-muted)", 
            maxWidth: "110px", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap" 
          }}>
            {user?.email}
          </span>
          <button 
            onClick={onToggleTheme}
            title={theme === "light" ? "Chuyển sang Giao diện Tối" : "Chuyển sang Giao diện Sáng"}
            style={{
              background: "var(--bg-inner)",
              border: "1px solid var(--border-inner)",
              borderRadius: "8px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-main)"
            }}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {isSupabaseConfigured && (
            <button 
              onClick={handleLogoutClick}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#f87171"
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {isSupabaseConfigured ? "Đồng bộ Supabase trực tuyến" : "Dữ liệu local trên thiết bị"}
        </span>
        <ExcelImporter userId={user.uid} onImportSuccess={onImportSuccess} />
      </div>
    </header>
  );
}
