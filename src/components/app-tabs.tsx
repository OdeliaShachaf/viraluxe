import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inventory</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="adjust">
        <NativeTabs.Trigger.Label>Adjust</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shopping-list">
        <NativeTabs.Trigger.Label>Shopping List</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart.fill" md="shopping_cart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
