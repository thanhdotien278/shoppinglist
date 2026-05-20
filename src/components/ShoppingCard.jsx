import { useState, useRef } from "react";
import { Camera, Plus, Minus, ChevronDown, ChevronUp, Trash2, Undo2, Image, Loader2 } from "lucide-react";
import { dbService } from "../firebase/dbService";

export default function ShoppingCard({ item, userId, onItemUpdate, onItemDelete, onTogglePurchase }) {
  const [uploading, setUploading] = useState(false);
  const [altUploading, setAltUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const altFileInputRef = useRef(null);

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const handleImageClick = () => {
    if (uploading) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await dbService.uploadImage(userId, item.id, file);
      onItemUpdate(item.id, { imageUrl });
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleAlternativeImageClick = () => {
    if (item.purchased || altUploading) return;
    altFileInputRef.current.click();
  };

  const handleAlternativeFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAltUploading(true);
    try {
      const alternativeImageUrl = await dbService.uploadImage(userId, item.id, file, "alternativeImageUrl");
      onItemUpdate(item.id, { alternativeImageUrl });
    } catch (err) {
      console.error("Failed to upload alternative image:", err);
    } finally {
      setAltUploading(false);
    }
  };

  const updateQuantity = async (amount) => {
    const newQty = Math.max(1, item.quantity + amount);
    if (newQty !== item.quantity) {
      onItemUpdate(item.id, { quantity: newQty });
      try {
        await dbService.updateItem(userId, item.id, { quantity: newQty });
      } catch (err) {
        console.error("Failed to update quantity on database:", err);
      }
    }
  };

  const activePrice = item.purchased ? item.actualPrice : item.referencePrice;
  const subtotal = activePrice * item.quantity;
  const hasDetails = item.notes || item.alternative || item.alternativeImageUrl;

  return (
    <div 
      className={`glass-card animate-slide ${item.purchased ? 'glow-green' : 'glow-blue'}`}
      style={{
        padding: "1.25rem",
        marginBottom: "1rem",
        border: item.purchased ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid var(--border-glass)",
        background: item.purchased ? "rgba(16, 185, 129, 0.03)" : "var(--bg-secondary)",
        opacity: item.purchased ? 0.9 : 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* Upper part: STT, Name, and Checkbox/Undo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexGrow: 1 }}>
          <span style={{ 
            fontSize: "0.8rem", 
            fontWeight: "700", 
            background: item.purchased ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
            color: item.purchased ? "var(--color-success)" : "var(--color-primary)",
            padding: "2px 8px", 
            borderRadius: "6px",
            marginTop: "3px"
          }}>
            #{item.stt}
          </span>
          <h4 style={{ 
            fontSize: "1.1rem", 
            fontWeight: "600", 
            lineHeight: "1.3",
            color: "var(--color-text-main)",
            textDecoration: item.purchased ? "line-through" : "none",
            opacity: item.purchased ? 0.7 : 1
          }}>
            {item.name}
          </h4>
        </div>

        {/* Big easy touch area for checkbox toggle */}
        <button 
          onClick={() => onTogglePurchase(item)}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: item.purchased ? "var(--color-success)" : "var(--bg-inner)",
            border: item.purchased ? "none" : "2px solid var(--border-inner)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease"
          }}
        >
          {item.purchased ? (
            <Undo2 size={20} color="#fff" />
          ) : (
            <div style={{ width: "12px", height: "12px", borderRadius: "2px", border: "2px solid transparent" }}></div>
          )}
        </button>
      </div>

      {/* Middle part: Image on left, Price and Qty on right */}
      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
        
        {/* Photo Container */}
        <div 
          onClick={handleImageClick}
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "12px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-glass)",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: "none" }}
          />

          {uploading ? (
            <Loader2 size={20} className="animate-spin" color="var(--color-primary)" />
          ) : item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", opacity: 0.6 }}>
              <Camera size={20} color="var(--color-text-muted)" />
              <span style={{ fontSize: "0.6rem", color: "var(--color-text-muted)" }}>Thêm ảnh</span>
            </div>
          )}
        </div>

        {/* Pricing details and quantity controls */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {item.purchased ? "Giá mua:" : "Giá tham chiếu:"}
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: item.purchased ? "var(--color-success)" : "var(--color-warning)" }}>
              {formatVND(activePrice)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Số lượng:</span>
            
            {item.purchased ? (
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-text-main)" }}>x{item.quantity}</span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid var(--border-glass)", padding: "2px" }}>
                <button 
                  onClick={() => updateQuantity(-1)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--color-text-muted)"
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", width: "24px", textAlign: "center", color: "var(--color-text-main)" }}>
                  {item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(1)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--color-text-muted)"
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--border-glass)", paddingTop: "4px", marginTop: "4px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Thành tiền:</span>
            <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-main)" }}>
              {formatVND(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable note and replacements section */}
      {(hasDetails || !item.purchased) && (
        <div style={{ borderTop: "1px solid var(--border-glass)", marginTop: "10px", paddingTop: "6px" }}>
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 0"
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Thu gọn ghi chú" : "Xem thêm ghi chú & thay thế"}
            {hasDetails && !expanded && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-warning)" }}></span>
            )}
          </button>

          {expanded && (
            <div className="animate-slide" style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Note field */}
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Ghi chú:</span>
                {item.purchased ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-main)", opacity: 0.8, marginTop: "2px" }}>
                    {item.notes || "Không có ghi chú"}
                  </p>
                ) : (
                  <input 
                    type="text" 
                    value={item.notes} 
                    onChange={e => onItemUpdate(item.id, { notes: e.target.value })}
                    onBlur={async () => {
                      try {
                        await dbService.updateItem(userId, item.id, { notes: item.notes });
                      } catch (err) {
                        console.error("Failed to save note:", err);
                      }
                    }}
                    placeholder="Thêm ghi chú mua sắm..."
                    style={{
                      width: "100%",
                      background: "var(--bg-inner)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      color: "var(--color-text-main)",
                      fontSize: "0.85rem",
                      marginTop: "2px",
                      outline: "none"
                    }}
                  />
                )}
              </div>

              {/* Alternative item field & Image upload */}
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Sản phẩm thay thế:</span>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px", alignItems: "center" }}>
                  <div style={{ flexGrow: 1 }}>
                    {item.purchased ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-main)", opacity: 0.8 }}>
                        {item.alternative || "Không có"}
                      </p>
                    ) : (
                      <input 
                        type="text" 
                        value={item.alternative || ""} 
                        onChange={e => onItemUpdate(item.id, { alternative: e.target.value })}
                        onBlur={async () => {
                          try {
                            await dbService.updateItem(userId, item.id, { alternative: item.alternative });
                          } catch (err) {
                            console.error("Failed to save alternative:", err);
                          }
                        }}
                        placeholder="Sản phẩm thay thế nếu hết hàng..."
                        style={{
                          width: "100%",
                          background: "var(--bg-inner)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "var(--color-text-main)",
                          fontSize: "0.85rem",
                          outline: "none"
                        }}
                      />
                    )}
                  </div>

                  {/* Alternative Image Selector */}
                  <div 
                    onClick={handleAlternativeImageClick}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      position: "relative",
                      overflow: "hidden",
                      cursor: item.purchased ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {!item.purchased && (
                      <input 
                        type="file" 
                        ref={altFileInputRef} 
                        onChange={handleAlternativeFileChange} 
                        accept="image/*" 
                        style={{ display: "none" }}
                      />
                    )}

                    {altUploading ? (
                      <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
                    ) : item.alternativeImageUrl ? (
                      <img 
                        src={item.alternativeImageUrl} 
                        alt="Thay thế" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    ) : item.purchased ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.4 }}>
                        <Image size={16} color="var(--color-text-muted)" />
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", opacity: 0.6 }}>
                        <Camera size={16} color="var(--color-text-muted)" />
                        <span style={{ fontSize: "0.55rem", color: "var(--color-text-muted)" }}>Ảnh</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete item button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button 
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                      onItemDelete(item.id);
                    }
                  }}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Trash2 size={14} />
                  Xóa khỏi danh sách
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
