import Ionicons from '@expo/vector-icons/Ionicons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs } from "expo-router";
import React from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface NavItem {
  id: string;
  icon: string;
  activeIcon: string;
  label: string;
  name: string;
}

const queryClient = new QueryClient();

const NAV_ITEMS: NavItem[] = [
  {
    id: 'index',
    icon: 'grid-outline',
    activeIcon: 'grid',
    label: 'Dashboard',
    name: '(tabs)/index',
  },
  {
    id: 'reminder',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    label: 'Reminders',
    name: '(tabs)/reminder',
  },
  {
    id: 'addReminder',
    icon: 'add-outline',
    activeIcon: 'add',
    label: 'Add Reminder',
    name: '(tabs)/addReminder',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    label: 'Settings',
    name: '(tabs)/settings',
  },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const backgroundColor = 'white';
  const activeBackgroundColor = '#f1e3ec';
  const iconColor = '#666';
  const activeIconColor = '#333';

  return (
    <View style={[styles.bottomNav, { backgroundColor }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;
        const navItem = NAV_ITEMS.find(item => item.name === route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            preventDefault: false,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.navItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                isFocused && { backgroundColor: activeBackgroundColor },
              ]}
            >
              <Ionicons
                name={
                  (isFocused
                    ? navItem?.activeIcon
                    : navItem?.icon) as any
                }
                size={24}
                color={isFocused ? activeIconColor : iconColor}
              />
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="(tabs)/index"
          options={{
            title: "Dashboard",
            tabBarLabel: "Dashboard",
          }}
        />
        <Tabs.Screen
          name="(tabs)/reminder"
          options={{
            title: "Reminders",
            tabBarLabel: "Reminders",
          }}
        />
        <Tabs.Screen
          name="(tabs)/addReminder"
          options={{
            title: "Add Reminder",
            tabBarLabel: "Add Reminder",
          }}
        />
        <Tabs.Screen
          name="(tabs)/settings"
          options={{
            title: "Settings",
            tabBarLabel: "Settings",
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}