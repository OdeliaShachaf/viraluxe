import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { InventoryItem } from '@/types/inventory';

type InventoryItemCardProps = {
  item: InventoryItem;
};

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const theme = useTheme();
  const isOutOfStock = item.quantity <= 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView style={styles.info}>
        <ThemedText type="smallBold">{item.itemName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.category}
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[
          styles.badge,
          { backgroundColor: isOutOfStock ? theme.dangerBackground : theme.successBackground },
        ]}>
        <ThemedText
          type="smallBold"
          style={{ color: isOutOfStock ? theme.danger : theme.success }}>
          {isOutOfStock ? 'Out of stock' : `Qty: ${item.quantity}`}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  info: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  badge: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
