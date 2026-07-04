import { type SQLiteDatabase } from 'expo-sqlite';

import { InventoryItem, ShoppingListItem } from '@/types/inventory';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
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
async function syncShoppingListForItem(
  db: SQLiteDatabase,
  itemName: string,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    await db.runAsync(
      `INSERT INTO shopping_list (item_name, suggested_quantity, status)
       VALUES (?, 1, 'pending')
       ON CONFLICT(item_name) DO UPDATE SET status = 'pending'`,
      [itemName],
    );
  } else {
    await db.runAsync(`DELETE FROM shopping_list WHERE item_name = ?`, [itemName]);
  }
}

export async function getItems(db: SQLiteDatabase, searchQuery = ''): Promise<InventoryItem[]> {
  const rows = await db.getAllAsync<InventoryRow>(
    `SELECT * FROM inventory WHERE item_name LIKE ? ORDER BY item_name ASC`,
    [`%${searchQuery}%`],
  );
  return rows.map(toInventoryItem);
}

export async function getItemByName(
  db: SQLiteDatabase,
  itemName: string,
): Promise<InventoryItem | null> {
  const row = await db.getFirstAsync<InventoryRow>(`SELECT * FROM inventory WHERE item_name = ?`, [
    itemName,
  ]);
  return row ? toInventoryItem(row) : null;
}

/** Adds stock for an item (simulating a receipt). Creates the item if it doesn't exist yet. */
export async function addItem(
  db: SQLiteDatabase,
  itemName: string,
  quantity: number,
  category: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO inventory (item_name, quantity, category, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(item_name) DO UPDATE SET
       quantity = quantity + excluded.quantity,
       category = excluded.category,
       updated_at = datetime('now')`,
    [itemName, quantity, category],
  );
  const item = await getItemByName(db, itemName);
  if (item) await syncShoppingListForItem(db, itemName, item.quantity);
}

/** Consumes stock for an item, clamped at 0. Auto-adds it to the shopping list at 0. */
export async function decrementItem(
  db: SQLiteDatabase,
  itemName: string,
  amount = 1,
): Promise<void> {
  await db.runAsync(
    `UPDATE inventory SET quantity = MAX(quantity - ?, 0), updated_at = datetime('now')
     WHERE item_name = ?`,
    [amount, itemName],
  );
  const item = await getItemByName(db, itemName);
  if (item) await syncShoppingListForItem(db, itemName, item.quantity);
}

/** Sets an item's quantity directly (e.g. restocking). Keeps the shopping list in sync. */
export async function updateQuantity(
  db: SQLiteDatabase,
  itemName: string,
  quantity: number,
): Promise<void> {
  await db.runAsync(
    `UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE item_name = ?`,
    [quantity, itemName],
  );
  await syncShoppingListForItem(db, itemName, quantity);
}

export async function getShoppingList(db: SQLiteDatabase): Promise<ShoppingListItem[]> {
  const rows = await db.getAllAsync<ShoppingListRow>(
    `SELECT * FROM shopping_list WHERE status = 'pending' ORDER BY item_name ASC`,
  );
  return rows.map(toShoppingListItem);
}

/** Marks a shopping list entry as bought: removes it from the list and restocks the inventory. */
export async function markAsBought(
  db: SQLiteDatabase,
  shoppingListId: number,
  restockQuantity = 1,
): Promise<void> {
  const row = await db.getFirstAsync<ShoppingListRow>(`SELECT * FROM shopping_list WHERE id = ?`, [
    shoppingListId,
  ]);
  if (!row) return;

  await db.runAsync(`DELETE FROM shopping_list WHERE id = ?`, [shoppingListId]);
  await updateQuantity(db, row.item_name, restockQuantity);
}
