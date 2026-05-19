import { useState, useEffect } from "react";
import { auth, isFirebaseConfigured } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./components/Auth";
import Header from "./components/Header";
import SpendingSummary from "./components/SpendingSummary";
import ShoppingCard from "./components/ShoppingCard";
import PriceConfirmModal from "./components/PriceConfirmModal";
import { dbService } from "./firebase/dbService";
import { Search, PlusCircle, Trash2, RefreshCw, ShoppingCart, CheckCircle2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // App UI State
  const [activeTab, setActiveTab] = useState("need-to-buy"); // 'need-to-buy' or 'purchased'
  const [searchQuery, setSearchQuery] = useState("");
  
  // Manual adding state
  const [newManualName, setNewManualName] = useState("");
  const [newManualPrice, setNewManualPrice] = useState("");
  const [newManualQty, setNewManualQty] = useState("1");
  const [showAddForm, setShowAddForm] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // Listen to Auth State
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
        } else {
          // Check local persistent state
          const cachedUser = localStorage.getItem("current_user");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser(null);
          }
        }
        setAuthLoading(false);
      });
      return unsubscribe;
    } else {
      const cachedUser = localStorage.getItem("current_user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      setAuthLoading(false);
    }
  }, []);

  // Fetch Items when user signs in
  useEffect(() => {
    if (user) {
      loadShoppingList();
    } else {
      setItems([]);
    }
  }, [user]);

  const loadShoppingList = async () => {
    if (!user) return;
    setLoadingItems(true);
    try {
      const list = await dbService.fetchItems(user.uid);
      setItems(list);
    } catch (err) {
      console.error("Failed to load shopping list:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("current_user", JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("current_user");
  };

  // Callback to update an item locally + DB is triggered in ShoppingCard
  const handleItemUpdate = (itemId, updates) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  // Remove an item
  const handleItemDelete = async (itemId) => {
    if (!user) return;
    try {
      await dbService.deleteItem(user.uid, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  // Ticking / Toggling Purchased Checkbox
  const handleTogglePurchase = (item) => {
    if (item.purchased) {
      // Revert from Purchased to Need-To-Buy directly without modal
      handleItemUpdate(item.id, { purchased: false, actualPrice: item.referencePrice });
      dbService.updateItem(user.uid, item.id, { purchased: false, actualPrice: item.referencePrice })
        .catch(err => console.error("Database update failed:", err));
    } else {
      // Trigger actual price confirmation popup modal
      setSelectedItemForModal(item);
      setIsModalOpen(true);
    }
  };

  // Confirm Purchase Modal callback
  const handleConfirmPurchase = async (actualPrice) => {
    if (!selectedItemForModal || !user) return;
    const itemId = selectedItemForModal.id;
    
    // Update local state
    handleItemUpdate(itemId, { purchased: true, actualPrice });
    setIsModalOpen(false);
    setSelectedItemForModal(null);

    // Update DB
    try {
      await dbService.updateItem(user.uid, itemId, { purchased: true, actualPrice });
    } catch (err) {
      console.error("Database update failed:", err);
    }
  };

  // Quick manual insertion
  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    if (!newManualName.trim() || !user) return;

    const nextStt = items.length > 0 ? Math.max(...items.map(it => it.stt || 0)) + 1 : 1;
    const priceNum = parseFloat(newManualPrice.replace(/\./g, "").replace(/,/g, "").trim()) || 0;
    const qtyNum = parseInt(newManualQty) || 1;

    const newItem = {
      stt: nextStt,
      name: newManualName.trim(),
      referencePrice: priceNum,
      actualPrice: priceNum,
      quantity: qtyNum,
      notes: "",
      alternative: "",
      purchased: false,
      imageUrl: ""
    };

    try {
      await dbService.importItems(user.uid, [newItem]);
      await loadShoppingList();
      
      // Reset inputs
      setNewManualName("");
      setNewManualPrice("");
      setNewManualQty("1");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add manual product:", err);
    }
  };

  // Reset entire list
  const handleResetList = async () => {
    if (!user) return;
    if (window.confirm("Bạn có muốn XÓA TOÀN BỘ danh sách mua sắm hiện tại để nạp lại từ đầu? Action này không thể hoàn tác.")) {
      setLoadingItems(true);
      try {
        for (const it of items) {
          await dbService.deleteItem(user.uid, it.id);
        }
        setItems([]);
      } catch (err) {
        console.error("Failed to reset list:", err);
      } finally {
        setLoadingItems(false);
      }
    }
  };

  // Filter items based on search and current tab
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "need-to-buy" ? !item.purchased : item.purchased;
    return matchesSearch && matchesTab;
  });

  if (authLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <RefreshCw className="animate-spin" size={40} color="var(--color-primary)" />
        <p style={{ color: "var(--color-text-muted)", marginTop: "1rem", fontSize: "0.95rem" }}>Đang khởi tạo phiên hoạt động...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "1rem" }}>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 12px 2rem 12px" }}>
      <Header user={user} onLogout={handleLogout} onImportSuccess={loadShoppingList} />

      <main>
        {items.length > 0 && <SpendingSummary items={items} />}

        {/* Search, Filter, and Controls bar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", position: "relative" }}>
          <div style={{ position: "relative", flexGrow: 1 }}>
            <Search size={18} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              style={{
                width: "100%",
                padding: "10px 10px 10px 38px",
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid var(--border-glass)",
                borderRadius: "10px",
                color: "#fff",
                outline: "none",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "10px 14px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid var(--border-glass)",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.9rem",
              fontWeight: "600"
            }}
          >
            <PlusCircle size={18} color="#3b82f6" />
            Thêm
          </button>
        </div>

        {/* Collapsible Manual Insertion Form */}
        {showAddForm && (
          <form onSubmit={handleManualAddSubmit} className="glass-card animate-slide" style={{ padding: "1.25rem", marginBottom: "1.25rem", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "10px", color: "var(--color-primary)" }}>Thêm Sản Phẩm Mới Thủ Công</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Tên sản phẩm (ví dụ: Dầu cá Omega 3)" 
                value={newManualName}
                onChange={e => setNewManualName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  placeholder="Giá tham chiếu (VND)" 
                  value={newManualPrice}
                  onChange={e => setNewManualPrice(e.target.value)}
                  style={{ flex: 2, padding: "10px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none" }}
                />
                <input 
                  type="number" 
                  min="1"
                  placeholder="SL" 
                  value={newManualQty}
                  onChange={e => setNewManualQty(e.target.value)}
                  style={{ flex: 1, padding: "10px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", textAlign: "center" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  style={{ padding: "8px 14px", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "8px 14px", background: "var(--color-primary)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Tạo mới
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Styled Active Slider Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === "need-to-buy" ? "active" : ""}`}
            onClick={() => setActiveTab("need-to-buy")}
          >
            <ShoppingCart size={18} />
            Cần Mua ({items.filter(it => !it.purchased).length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "purchased" ? "active" : ""}`}
            onClick={() => setActiveTab("purchased")}
          >
            <CheckCircle2 size={18} />
            Đã Mua ({items.filter(it => it.purchased).length})
          </button>
        </div>

        {/* Content Panel Loading spinner */}
        {loadingItems ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <RefreshCw className="animate-spin" size={32} color="var(--color-primary)" />
          </div>
        ) : (
          <div style={{ minHeight: "200px" }}>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <ShoppingCard 
                  key={item.id} 
                  item={item} 
                  userId={user.uid}
                  onItemUpdate={handleItemUpdate}
                  onItemDelete={handleItemDelete}
                  onTogglePurchase={handleTogglePurchase}
                />
              ))
            ) : (
              /* High aesthetics Empty state */
              <div className="glass-card animate-slide" style={{ padding: "3rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", borderStyle: "dashed" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <ShoppingCart size={28} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
                </div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "600", color: "#fff" }}>
                  {items.length === 0 
                    ? "Không có sản phẩm nào" 
                    : activeTab === "need-to-buy" 
                      ? "Đã mua hết toàn bộ!" 
                      : "Chưa mua sản phẩm nào"}
                </h4>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "6px", maxWidth: "280px" }}>
                  {items.length === 0 
                    ? "Hãy chọn nạp file Excel ở thanh tiêu đề trên cùng để bắt đầu nhanh danh sách mua sắm của bạn!"
                    : activeTab === "need-to-buy"
                      ? "Tất cả sản phẩm đã được mua và trượt mượt mà sang Tab Đã Mua rồi đấy!"
                      : "Bắt đầu tick chọn sản phẩm tại Tab Cần Mua và xác nhận giá để theo dõi chi tiêu thực tế của bạn."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Global actions row */}
        {items.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <button 
              onClick={handleResetList}
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <Trash2 size={16} />
              Xóa sạch danh sách hiện tại
            </button>
          </div>
        )}
      </main>

      {/* Global Interactive Modal Backdrop */}
      <PriceConfirmModal 
        isOpen={isModalOpen}
        item={selectedItemForModal}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedItemForModal(null);
        }}
      />
    </div>
  );
}
