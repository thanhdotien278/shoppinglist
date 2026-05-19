import React from "react";
import { LogOut, ShoppingBag } from "lucide-react";
import ExcelImporter from "./ExcelImporter";
import { auth, isFirebaseConfigured } from "../firebase/config";
import { signOut } from "firebase/auth";

export default function Header({ user, onLogout, onImportSuccess }) {
  
  const handleLogoutClick = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Firebase sign out failed:", err);
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
          <h1 style={{ fontSize: "1.2rem", fontWeight: "700", letterSpacing: "-0.5px", color: "#fff" }}>Shopping List</h1>
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
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {isFirebaseConfigured ? "Đồng bộ Firestore trực tuyến" : "Offline LocalStorage"}
        </span>
        <ExcelImporter userId={user.uid} onImportSuccess={onImportSuccess} />
      </div>
    </header>
  );
}
