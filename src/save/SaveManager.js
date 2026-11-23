// src/save/SaveManager.js
// Hệ thống lưu game nhiều ô bằng IndexedDB (tự động fallback sang LocalStorage khi chạy trong sandbox) và lưu cài đặt đồ họa
export class SaveManager {
  constructor() {
    this.dbName = 'PSG_President_Sim_3D_DB';
    this.storeName = 'saves';
    this.settingsKey = 'psg_president_3d_settings';
  }

  openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('No IndexedDB'));
      try {
        const req = window.indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'slot' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async saveSlot(slotId, stateSnapshot) {
    const payload = {
      slot: slotId,
      savedAt: new Date().toLocaleString('vi-VN'),
      summary: `Mùa ${stateSnapshot.season} · Tuần ${stateSnapshot.week} · €${stateSnapshot.finance.budget.toFixed(1)}M`,
      data: stateSnapshot
    };
    try {
      const db = await this.openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put(payload);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      return { ok: true, mode: 'IndexedDB', payload };
    } catch (_) {
      try {
        localStorage.setItem(`psg_save_${slotId}`, JSON.stringify(payload));
        return { ok: true, mode: 'LocalStorage', payload };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  }

  async loadSlot(slotId) {
    try {
      const db = await this.openDB();
      const rec = await new Promise((res, rej) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const req = tx.objectStore(this.storeName).get(slotId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });
      if (rec) return rec;
    } catch (_) {}
    try {
      const raw = localStorage.getItem(`psg_save_${slotId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async listSlots() {
    const slots = [];
    for (const id of ['slot_1', 'slot_2', 'slot_3']) {
      const rec = await this.loadSlot(id);
      slots.push({ id, rec });
    }
    return slots;
  }

  saveSettings(settings) {
    try { localStorage.setItem(this.settingsKey, JSON.stringify(settings)); } catch (_) {}
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.settingsKey);
      return raw ? JSON.parse(raw) : { quality: 'Medium', muted: false };
    } catch (_) {
      return { quality: 'Medium', muted: false };
    }
  }
}
