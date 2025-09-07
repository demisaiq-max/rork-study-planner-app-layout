import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color?: string;
  backgroundColor?: string;
  showMultipleRings?: boolean;
  showPercentage?: boolean;
  centerText?: string;
  selectedSubject?: string | null;
  subjectGrades?: Record<string, number>;
}

export default function CircularProgress({ 
  percentage, 
  size, 
  strokeWidth,
  color = "#007AFF",
  backgroundColor = "#E5E5EA",
  showMultipleRings = false,
  showPercentage = true,
  centerText,
  selectedSubject,
  subjectGrades
}: CircularProgressProps) {
  if (showMultipleRings) {
    const ringSpacing = strokeWidth + 6;
    
    let rings;
    if (selectedSubject && subjectGrades) {
      const grade = subjectGrades[selectedSubject] || 1;
      const gradePercentage = ((6 - grade) / 5) * 100;
      rings = [
        { radius: (size - strokeWidth) / 2, percentage: gradePercentage, color: grade <= 2 ? "#34C759" : grade <= 3 ? "#FF9500" : "#FF3B30" },
        { radius: (size - strokeWidth) / 2 - ringSpacing, percentage: gradePercentage * 0.8, color: grade <= 2 ? "#34C759" : grade <= 3 ? "#FF9500" : "#FF3B30" },
        { radius: (size - strokeWidth) / 2 - ringSpacing * 2, percentage: gradePercentage * 0.6, color: grade <= 2 ? "#34C759" : grade <= 3 ? "#FF9500" : "#FF3B30" }
      ];
    } else {
      rings = [
        { radius: (size - strokeWidth) / 2, percentage: 80, color: "#34C759" },
        { radius: (size - strokeWidth) / 2 - ringSpacing, percentage: 65, color: "#FF9500" },
        { radius: (size - strokeWidth) / 2 - ringSpacing * 2, percentage: 50, color: "#FF3B30" }
      ];
    }

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
          {rings.map((ring, index) => {
            const circumference = 2 * Math.PI * ring.radius;
            const strokeDashoffset = circumference - (ring.percentage / 100) * circumference;
            
            return (
              <React.Fragment key={index}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ring.radius}
                  stroke="#E5E5EA"
                  strokeWidth={strokeWidth - 1}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ring.radius}
                  stroke={ring.color}
                  strokeWidth={strokeWidth - 1}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </React.Fragment>
            );
          })}
        </Svg>
        {centerText && (
          <Text style={styles.centerText}>{centerText}</Text>
        )}
      </View>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {centerText && (
        <Text style={[styles.centerText, { fontSize: size * 0.35 }]}>{centerText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerText: {
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    position: 'absolute',
  },
});