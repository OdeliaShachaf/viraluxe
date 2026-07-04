import * as SQLite from 'expo-sqlite';

import { InventoryItem, ShoppingListItem } from '@/types/inventory';

const db = SQLite.openDatabaseSync('viraluxe.db');

function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL UNIQUE,
      quantity INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shopping_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL UNIQUE,
      suggested_quantity INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
}

initDatabase();

type InventoryRow = {
  id: number;
  item_name: string;
  quantity: number;
  category: string;
  updated_at: string;
};

type ShoppingListRow = {
  id: number;
  item_name: string;
  suggested_quantity: number;
  status: 'pending' | 'bought';
};

function toInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    itemName: row.item_name,
    quantity: row.quantity,
    category: row.category,
    updatedAt: row.updated_at,
  };
}

function toShoppingListItem(row: ShoppingListRow): ShoppingListItem {
  return {
    id: row.id,
    itemName: row.item_name,
    suggestedQuantity: row.suggested_quantity,
    status: row.status,
  };
}

/** Keeps the shopping list in sync with an item's current quantity. */
function syncShoppingListForItem(itemName: string, quantity: number): void {
  if (quantity <= 0) {
    db.runSync(
      `INSERT INTO shopping_list (item_name, suggested_quantity, status)
       VALUES (?, 1, 'pending')
       ON CONFLICT(item_name) DO UPDATE SET status = 'pending'`,
      [itemName],
    );
  } else {
    db.runSync(`DELETE FROM shopping_list WHERE item_name = ?`, [itemName]);
  }
}

export function getItems(searchQuery = ''): InventoryItem[] {
  const rows = db.getAllSync<InventoryRow>(
    `SELECT * FROM inventory WHERE item_name LIKE ? ORDER BY item_name ASC`,
    [`%${searchQuery}%`],
  );
  return rows.map(toInventoryItem);
}

export function getItemByName(itemName: string): InventoryItem | null {
  const row = db.getFirstSync<InventoryRow>(`SELECT * FROM inventory WHERE item_name = ?`, [
    itemName,
  ]);
  return row ? toInventoryItem(row) : null;
}

/** Adds stock for an item (simulating a receipt). Creates the item if it doesn't exist yet. */
export function addItem(itemName: string, quantity: number, category: string): void {
  db.runSync(
    `INSERT INTO inventory (item_name, quantity, category, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(item_name) DO UPDATE SET
       quantity = quantity + excluded.quantity,
       category = excluded.category,
       updated_at = datetime('now')`,
    [itemName, quantity, category],
  );
  const item = getItemByName(itemName);
  if (item) syncShoppingListForItem(itemName, item.quantity);
}

/** Consumes stock for an item, clamped at 0. Auto-adds it to the shopping list at 0. */
export function decrementItem(itemName: string, amount = 1): void {
  db.runSync(
    `UPDATE inventory SET quantity = MAX(quantity - ?, 0), updated_at = datetime('now')
     WHERE item_name = ?`,
    [amount, itemName],
  );
  const item = getItemByName(itemName);
  if (item) syncShoppingListForItem(itemName, item.quantity);
}

/** Sets an item's quantity directly (e.g. restocking). Keeps the shopping list in sync. */
export function updateQuantity(itemName: string, quantity: number): void {
  db.runSync(
    `UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE item_name = ?`,
    [quantity, itemName],
  );
  syncShoppingListForItem(itemName, quantity);
}

export function getShoppingList(): ShoppingListItem[] {
  const rows = db.getAllSync<ShoppingListRow>(
    `SELECT * FROM shopping_list WHERE status = 'pending' ORDER BY item_name ASC`,
  );
  return rows.map(toShoppingListItem);
}

/** Marks a shopping list entry as bought: removes it from the list and restocks the inventory. */
export function markAsBought(shoppingListId: number, restockQuantity = 1): void {
  const row = db.getFirstSync<ShoppingListRow>(`SELECT * FROM shopping_list WHERE id = ?`, [
    shoppingListId,
  ]);
  if (!row) return;

  db.runSync(`DELETE FROM shopping_list WHERE id = ?`, [shoppingListId]);
  updateQuantity(row.item_name, restockQuantity);
}
