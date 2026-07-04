import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilterChips } from '@/components/inventory/category-filter-chips';
import { InventoryItemCard } from '@/components/inventory/inventory-item-card';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { InventoryItem } from '@/types/inventory';

// Mock data for the UI-only preview. Will be replaced by SQLite queries once the
// database layer is wired up in the next step.
const MOCK_INVENTORY: InventoryItem[] = [
  { id: 1, itemName: 'Milk', quantity: 2, category: 'Dairy', updatedAt: '' },
  { id: 2, itemName: 'Eggs', quantity: 0, category: 'Dairy', updatedAt: '' },
  { id: 3, itemName: 'Bread', quantity: 1, category: 'Bakery', updatedAt: '' },
  { id: 4, itemName: 'Rice', quantity: 4, category: 'Pantry', updatedAt: '' },
  { id: 5, itemName: 'Olive Oil', quantity: 0, category: 'Pantry', updatedAt: '' },
  { id: 6, itemName: 'Dish Soap', quantity: 1, category: 'Household', updatedAt: '' },
];

export function InventoryDashboardScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(MOCK_INVENTORY.map((item) => item.category))),
    [],
  );

  const filteredItems = useMemo(() => {
    return MOCK_INVENTORY.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = selectedCategory === null || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Inventory</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {filteredItems.length} of {MOCK_INVENTORY.length} items
          </ThemedText>
        </ThemedView>

        <SearchBar value={search} onChangeText={setSearch} />
        <CategoryFilterChips
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <InventoryItemCard item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No items match your search.
            </ThemedText>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.half,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
