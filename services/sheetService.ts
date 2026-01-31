import { InventoryItem, Transaction, Category, TransactionType } from '../types';

// Google Sheet API URL - Direct Connection
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyCpvRJc3IjuvRJClmjXdVQU_3CLu-WOVNQU9auzRYH8MDvOQRmNLZk70w9GL4OyonA5Q/exec';

// Google Drive folder ID for file uploads
const GOOGLE_DRIVE_FOLDER_ID = '1miMudOBbLVGNop-1VRbsHYsc3jKaJG7B';

// Get API URL (from localStorage or default)
export const getStoredConfig = (): string => {
  return localStorage.getItem('satyam_mall_sheet_url') || GOOGLE_SHEET_API_URL;
};

export const saveConfig = (url: string) => {
  localStorage.setItem('satyam_mall_sheet_url', url);
};

// Fetch Inventory from Google Sheet
export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const url = getStoredConfig();

  try {
    const response = await fetch(`${url}?sheet=Inventory`);
    const data = await response.json();

    if (data.error) {
      console.error("Sheet error:", data.error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any, index: number) => ({
      id: String(row.id || index + 1),
      name: row.name || '',
      category: (row.category as Category) || Category.OTHERS,
      quantity: Number(row.quantity) || 0,
      unit: row.unit || 'pcs',
      minLevel: Number(row.minlevel || row.minLevel || 5)
    }));
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return [];
  }
};

// Fetch Transactions from Google Sheet
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const url = getStoredConfig();

  try {
    const response = await fetch(`${url}?sheet=Transactions`);
    const data = await response.json();

    if (data.error) {
      console.error("Sheet error:", data.error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any, index: number) => ({
      id: String(index + 1),
      date: row.date || new Date().toISOString(),
      type: row.type as TransactionType,
      itemName: row.itemname || row.itemName || '',
      quantity: Number(row.quantity) || 0,
      unit: row.unit || '',
      location: row.location || '',
      personName: row.personname || row.personName || '',
      notes: row.notes || ''
    }));
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
};

// Submit new transaction (Issue/Receive)
export const submitTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<boolean> => {
  const url = getStoredConfig();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'addTransaction',
        ...transaction
      })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Submission failed:", error);
    return false;
  }
};

// Update inventory quantity directly
export const updateInventoryQuantity = async (itemName: string, newQuantity: number): Promise<boolean> => {
  const url = getStoredConfig();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'updateInventory',
        itemName: itemName,
        newQuantity: newQuantity
      })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Update failed:", error);
    return false;
  }
};

// Add new inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<boolean> => {
  const url = getStoredConfig();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'addInventoryItem',
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minLevel: item.minLevel
      })
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Add item failed:", error);
    return false;
  }
};

// Upload file to Google Drive
export const uploadFileToDrive = async (file: File, itemName: string): Promise<{ success: boolean; fileUrl?: string }> => {
  const url = getStoredConfig();

  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: `${itemName}_${Date.now()}_${file.name}`,
        mimeType: file.type,
        fileData: base64Data,
        folderId: GOOGLE_DRIVE_FOLDER_ID
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      return { success: true, fileUrl: result.fileUrl };
    }

    return { success: false };
  } catch (error) {
    console.error("File upload failed:", error);
    return { success: false };
  }
};
