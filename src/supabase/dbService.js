import { supabase, isSupabaseConfigured } from "./config";
import seedItems from "../data/localShoppingItems.json";

const TABLE_NAME = "shopping_items";

const toAppItem = (row) => ({
  id: row.id,
  stt: row.stt,
  name: row.name,
  referencePrice: Number(row.reference_price || 0),
  actualPrice: Number(row.actual_price || 0),
  quantity: row.quantity,
  notes: row.notes || "",
  alternative: row.alternative || "",
  purchased: row.purchased,
  imageUrl: row.image_url || "",
  alternativeImageUrl: row.alternative_image_url || ""
});

const toDbItem = (userId, item) => ({
  user_id: userId,
  stt: item.stt || 0,
  name: item.name,
  reference_price: item.referencePrice || 0,
  actual_price: item.actualPrice || 0,
  quantity: item.quantity || 1,
  notes: item.notes || "",
  alternative: item.alternative || "",
  purchased: Boolean(item.purchased),
  image_url: item.imageUrl || "",
  alternative_image_url: item.alternativeImageUrl || ""
});

const toDbUpdates = (updates) => {
  const fields = {
    stt: "stt",
    name: "name",
    referencePrice: "reference_price",
    actualPrice: "actual_price",
    quantity: "quantity",
    notes: "notes",
    alternative: "alternative",
    purchased: "purchased",
    imageUrl: "image_url",
    alternativeImageUrl: "alternative_image_url"
  };

  return Object.fromEntries(
    Object.entries(updates)
      .filter(([key]) => fields[key])
      .map(([key, value]) => [fields[key], value])
  );
};

const getLocalItems = (userId) => {
  const key = `shopping_list_${userId}`;
  const seededKey = `${key}_seeded`;
  const savedItems = JSON.parse(localStorage.getItem(key) || "[]");

  if (savedItems.length === 0 && !localStorage.getItem(seededKey)) {
    const initialItems = seedItems.map(item => ({ ...item }));
    localStorage.setItem(key, JSON.stringify(initialItems));
    localStorage.setItem(seededKey, "true");
    return initialItems;
  }

  return savedItems;
};

const saveLocalItems = (userId, items) => {
  const key = `shopping_list_${userId}`;
  localStorage.setItem(key, JSON.stringify(items));
};

const fileToCompressedDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File được chọn không phải ảnh."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = error => reject(error);
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Không đọc được ảnh đã chọn."));
      image.onload = () => {
        const maxDimension = 900;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

export const dbService = {
  async fetchItems(userId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("user_id", userId)
        .order("stt", { ascending: true });

      if (error) throw error;
      return data.map(toAppItem);
    }

    return getLocalItems(userId).sort((a, b) => a.stt - b.stt);
  },

  async importItems(userId, newItems) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .insert(newItems.map(item => toDbItem(userId, item)));

      if (error) throw error;
      return;
    }

    const current = getLocalItems(userId);
    const merged = [
      ...current,
      ...newItems.map(it => ({
        ...it,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString()
      }))
    ];
    saveLocalItems(userId, merged);
  },

  async updateItem(userId, itemId, updates) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(toDbUpdates(updates))
        .eq("id", itemId)
        .eq("user_id", userId);

      if (error) throw error;
      return;
    }

    const current = getLocalItems(userId);
    const updated = current.map(it => it.id === itemId ? { ...it, ...updates } : it);
    saveLocalItems(userId, updated);
  },

  async deleteItem(userId, itemId) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq("id", itemId)
        .eq("user_id", userId);

      if (error) throw error;
      return;
    }

    const current = getLocalItems(userId);
    const filtered = current.filter(it => it.id !== itemId);
    saveLocalItems(userId, filtered);
  },

  async uploadImage(userId, itemId, file, field = "imageUrl") {
    const dataUrl = await fileToCompressedDataUrl(file);
    await this.updateItem(userId, itemId, { [field]: dataUrl });
    return dataUrl;
  }
};
