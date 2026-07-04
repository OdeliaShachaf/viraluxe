import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { addItem, decrementItem, getItems } from '@/database/database';
import { useTheme } from '@/hooks/use-theme';
import { InventoryItem } from '@/types/inventory';

export function ManualAdjustmentScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');

  const refresh = useCallback(() => {
    getItems(db).then(setItems);
  }, [db]);

  useFocusEffect(refresh);

  async function handleAdd() {
    const trimmedName = itemName.trim();
    const parsedQuantity = parseInt(quantity, 10);
    if (!trimmedName || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;

    await addItem(db, trimmedName, parsedQuantity, category.trim());
    setItemName('');
    setQuantity('1');
    setCategory('');
    refresh();
  }

  async function handleDecrement(name: string) {
    await decrementItem(db, name, 1);
    refresh();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Adjust</ThemedText>

        <ThemedView type="backgroundElement" style={styles.form}>
          <ThemedText type="smallBold">Add item (simulate a receipt)</ThemedText>
          <TextInput
            value={itemName}
            onChangeText={setItemName}
            placeholder="Item name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
          <ThemedView style={styles.row}>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Quantity"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              style={[styles.input, styles.rowInput, { color: theme.text }]}
            />
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Category (optional)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.rowInput, { color: theme.text }]}
            />
          </ThemedView>
          <Pressable onPress={handleAdd} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundSelected" style={styles.addButton}>
              <ThemedText type="smallBold">Add to inventory</ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        <ThemedText type="smallBold">Consume items</ThemedText>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.itemRow}>
              <ThemedView style={styles.itemInfo}>
                <ThemedText type="smallBold">{item.itemName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.category} · Qty: {item.quantity}
                </ThemedText>
              </ThemedView>
              <Pressable
                onPress={() => handleDecrement(item.itemName)}
                disabled={item.quantity <= 0}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView
                  type="backgroundSelected"
                  style={[styles.decrementButton, item.quantity <= 0 && styles.disabled]}>
                  <ThemedText type="smallBold">-1</ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>
          )}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No items yet. Add one above.
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
  form: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowInput: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  itemInfo: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  decrementButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
