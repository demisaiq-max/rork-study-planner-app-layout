import { Tabs } from "expo-router";
import { Home, Clock, BookOpen, BarChart3, Users } from "lucide-react-native";
import React from "react";
import { useLanguage } from "@/hooks/language-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5EA",
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home') || '홈',
          tabBarIcon: ({ color, size }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: t('timer') || '타이머',
          tabBarIcon: ({ color, size }) => <Clock size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: t('notes') || '목록',
          tabBarIcon: ({ color, size }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('stats') || '성적관리',
          tabBarIcon: ({ color, size }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('community') || '커뮤니티',
          tabBarIcon: ({ color, size }) => <Users size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}