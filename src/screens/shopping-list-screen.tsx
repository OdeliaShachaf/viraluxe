import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getShoppingList, markAsBought } from '@/database/database';
import { useTheme } from '@/hooks/use-theme';
import { ShoppingListItem } from '@/types/inventory';

export function ShoppingListScreen() {
  const theme = useTheme();
  const [pendingItems, setPendingItems] = useState<ShoppingListItem[]>([]);
  const [restockQuantities, setRestockQuantities] = useState<Record<number, string>>({});

  const refresh = useCallback(() => {
    const list = getShoppingList();
    setPendingItems(list);
    setRestockQuantities((current) => {
      const next: Record<number, string> = {};
      for (const item of list) {
        next[item.id] = current[item.id] ?? String(item.suggestedQuantity);
      }
      return next;
    });
  }, []);

  useFocusEffect(refresh);

  function handleBought(item: ShoppingListItem) {
    const parsedQuantity = parseInt(restockQuantities[item.id] ?? '', 10);
    const restockQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
    markAsBought(item.id, restockQuantity);
    refresh();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Shopping List</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {pendingItems.length} item{pendingItems.length === 1 ? '' : 's'} to buy
          </ThemedText>
        </ThemedView>

        <FlatList
          data={pendingItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.itemRow}>
              <ThemedText type="smallBold" style={styles.itemName}>
                {item.itemName}
              </ThemedText>

              <TextInput
                value={restockQuantities[item.id] ?? String(item.suggestedQuantity)}
                onChangeText={(text) =>
                  setRestockQuantities((current) => ({ ...current, [item.id]: text }))
                }
                keyboardType="number-pad"
                style={[styles.quantityInput, { color: theme.text }]}
              />

              <Pressable onPress={() => handleBought(item)} style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundSelected" style={styles.boughtButton}>
                  <ThemedText type="smallBold">Bought</ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>
          )}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Nothing to buy right now.
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  itemName: {
    flex: 1,
  },
  quantityInput: {
    width: 48,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  boughtButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
