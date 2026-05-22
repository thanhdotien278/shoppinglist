import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabase/config";
import { ShoppingBag, Lock, Mail, UserPlus, LogIn } from "lucide-react";

const normalizeSupabaseUser = (user) => ({
  ...user,
  uid: user.id
});

const registerUser = async (email, password) => {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Không đăng ký được tài khoản.");
  }
};

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        if (isRegister) {
          await registerUser(email, password);
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess(normalizeSupabaseUser(data.user));
      } catch (err) {
        const message = err.message === "User already registered"
          ? "Email này đã được đăng ký. Vui lòng chuyển sang đăng nhập."
          : err.message;
        setError(message);
      }
    } else {
      // Mock Auth Flow using LocalStorage
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      if (isRegister) {
        if (mockUsers.some(u => u.email === email)) {
          setError("Email đã được đăng ký!");
          return;
        }
        const newUser = { email, password, uid: "mock_" + Math.random().toString(36).substring(2, 9) };
        mockUsers.push(newUser);
        localStorage.setItem("mock_users", JSON.stringify(mockUsers));
        onLoginSuccess(newUser);
      } else {
        const matchedUser = mockUsers.find(u => u.email === email && u.password === password);
        if (matchedUser) {
          onLoginSuccess(matchedUser);
        } else {
          // First user quick creation convenience for offline testing
          if (mockUsers.length === 0) {
            const newUser = { email, password, uid: "mock_root" };
            mockUsers.push(newUser);
            localStorage.setItem("mock_users", JSON.stringify(mockUsers));
            onLoginSuccess(newUser);
            return;
          }
          setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }
      }
    }
  };

  return (
    <div className="glass-card animate-slide" style={{ maxWidth: "420px", margin: "4rem auto 2rem auto", padding: "2.5rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
          <ShoppingBag size={32} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.5px" }}>Shopping List</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
          {isSupabaseConfigured ? "Đồng bộ hóa Supabase trực tuyến" : "Offline Sandbox Mode (LocalStorage)"}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Email</label>
          <div style={{ position: "relative" }}>
            <Mail size={18} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ten@vienduong.com" 
              style={{ width: "100%", padding: "12px 12px 12px 40px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Mật khẩu</label>
          <div style={{ position: "relative" }}>
            <Lock size={18} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              style={{ width: "100%", padding: "12px 12px 12px 40px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "10px", color: "var(--color-text-main)", outline: "none", fontSize: "0.95rem" }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          style={{ width: "100%", padding: "12px", background: "var(--color-primary)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "1rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "0.5rem" }}
        >
          {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
          {isRegister ? "Đăng ký tài khoản" : "Đăng nhập ngay"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button 
          onClick={() => setIsRegister(!isRegister)} 
          style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.85rem", cursor: "pointer" }}
        >
          {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký tại đây"}
        </button>
      </div>
    </div>
  );
}
