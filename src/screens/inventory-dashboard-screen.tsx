import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilterChips } from '@/components/inventory/category-filter-chips';
import { InventoryItemCard } from '@/components/inventory/inventory-item-card';
import { SearchBar } from '@/components/inventory/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getItems } from '@/database/database';
import { InventoryItem } from '@/types/inventory';

export function InventoryDashboardScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getItems(db).then(setItems);
    }, [db]),
  );

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [
    items,
  ]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = selectedCategory === null || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Inventory</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {filteredItems.length} of {items.length} items
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
              {items.length === 0
                ? 'Your inventory is empty. Add items from the Adjust tab.'
                : 'No items match your search.'}
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
