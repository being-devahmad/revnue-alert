import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface NavItem {
  id: string;
  icon: string;
  activeIcon: string;
  label: string;
  name: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "index",
    icon: "grid-outline",
    activeIcon: "grid",
    label: "Dashboard",
    name: "index",
  },
  {
    id: "reminder",
    icon: "calendar-outline",
    activeIcon: "calendar",
    label: "Reminders",
    name: "reminder",
  },
  {
    id: "addReminder",
    icon: "add-outline",
    activeIcon: "add",
    label: "Add Reminder",
    name: "addReminder",
  },
  {
    id: "settings",
    icon: "settings-outline",
    activeIcon: "settings",
    label: "Settings",
    name: "settings",
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
  const backgroundColor = "white";
  const activeBackgroundColor = "#f1e3ec";
  const iconColor = "#666";
  const activeIconColor = "#333";

  return (
    <View style={[styles.bottomNav, { backgroundColor }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];

        const isFocused = state.index === index;
        const navItem = NAV_ITEMS.find((item) => item.name === route.name);

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
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
                name={(isFocused
                  ? navItem?.activeIcon
                  : navItem?.icon) as any}
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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="reminder" options={{ title: "Reminders" }} />
      <Tabs.Screen name="addReminder" options={{ title: "Add Reminder" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
});
