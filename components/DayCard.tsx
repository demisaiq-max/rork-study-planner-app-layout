import React from "react";
import { Text, StyleSheet, TouchableOpacity, Dimensions, View } from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

interface DayCardProps {
  title: string;
  daysLeft: number;
  date: string;
  priority?: "high" | "medium" | "low";
}

export default function DayCard({ title, daysLeft, date, priority }: DayCardProps) {
  const isUrgent = daysLeft <= 30;
  const validDaysLeft = !isNaN(daysLeft) && isFinite(daysLeft) ? daysLeft : 0;
  
  const handlePress = () => {
    router.push('/exam-management');
  };
  
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "#FF3B30";
      case "low":
        return "#34C759";
      case "medium":
      default:
        return "#FF9500";
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.card, isUrgent && styles.cardUrgent]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {priority && (
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={[styles.daysLeft, isUrgent && styles.daysLeftUrgent]}>
        D-{validDaysLeft}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: (width - 40 - 12) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  priorityIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardUrgent: {
    backgroundColor: "#FFF4F4",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  title: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: "#C7C7CC",
    marginBottom: 8,
  },
  daysLeft: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  daysLeftUrgent: {
    color: "#FF3B30",
  },
});