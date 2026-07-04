export interface InventoryItem {
  id: number;
  itemName: string;
  quantity: number;
  category: string;
  updatedAt: string;
}

export type ShoppingListStatus = 'pending' | 'bought';

export interface ShoppingListItem {
  id: number;
  itemName: string;
  suggestedQuantity: number;
  status: ShoppingListStatus;
}
