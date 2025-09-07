import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { X, Check } from "lucide-react-native";
import { useStudyStore } from "@/hooks/study-store";
import { useLanguage } from "@/hooks/language-context";
import CircularProgress from "@/components/CircularProgress";

export default function ExamScoreEditScreen() {
  const { dDays, selectedExamId, updateExamScores } = useStudyStore();
  const { t } = useLanguage();
  
  const selectedExam = dDays?.find(exam => exam.id === selectedExamId);
  
  const [targetPercentile, setTargetPercentile] = useState("");
  const [averagePercentile, setAveragePercentile] = useState("");
  const [recentPercentile, setRecentPercentile] = useState("");
  
  useEffect(() => {
    if (selectedExam?.scores) {
      setTargetPercentile(selectedExam.scores.targetPercentile.toString());
      setAveragePercentile(selectedExam.scores.averagePercentile.toString());
      setRecentPercentile(selectedExam.scores.recentPercentile.toString());
    }
  }, [selectedExam]);

  const handleSave = () => {
    const target = parseInt(targetPercentile);
    const average = parseInt(averagePercentile);
    const recent = parseInt(recentPercentile);
    
    if (isNaN(target) || isNaN(average) || isNaN(recent)) {
      Alert.alert(t('error'), "Please enter valid percentile values");
      return;
    }
    
    if (target < 0 || target > 100 || average < 0 || average > 100 || recent < 0 || recent > 100) {
      Alert.alert(t('error'), "Percentile values must be between 0 and 100");
      return;
    }
    
    if (selectedExamId && updateExamScores) {
      updateExamScores(selectedExamId, {
        targetPercentile: target,
        averagePercentile: average,
        recentPercentile: recent,
      });
      router.back();
    }
  };

  if (!selectedExam) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: "Edit Exam Scores",
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }} 
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No exam selected</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Edit Exam Scores",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Check size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.examTitle}>{selectedExam.title}</Text>
            <Text style={styles.examDate}>{selectedExam.date}</Text>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Score Preview</Text>
            <View style={styles.circlesContainer}>
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={parseInt(targetPercentile) || 0}
                  size={80}
                  strokeWidth={6}
                  color="#333333"
                  centerText={(parseInt(targetPercentile) || 0).toString()}
                />
                <Text style={styles.circleLabel}>목표 백분위</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={parseInt(averagePercentile) || 0}
                  size={80}
                  strokeWidth={6}
                  color="#E5E5EA"
                  centerText={(parseInt(averagePercentile) || 0).toString()}
                />
                <Text style={styles.circleLabel}>평균 백분위</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={parseInt(recentPercentile) || 0}
                  size={80}
                  strokeWidth={6}
                  color="#8E8E93"
                  centerText={(parseInt(recentPercentile) || 0).toString()}
                />
                <Text style={styles.circleLabel}>최근 백분위</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Percentile</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={targetPercentile}
                  onChangeText={setTargetPercentile}
                  placeholder="0-100"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
              <Text style={styles.inputHelp}>Your goal percentile for this exam</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Average Percentile</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={averagePercentile}
                  onChangeText={setAveragePercentile}
                  placeholder="0-100"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
              <Text style={styles.inputHelp}>Your average performance in mock exams</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recent Percentile</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={recentPercentile}
                  onChangeText={setRecentPercentile}
                  placeholder="0-100"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
              <Text style={styles.inputHelp}>Your most recent exam score</Text>
            </View>

            <View style={styles.quickSelectSection}>
              <Text style={styles.quickSelectTitle}>Quick Select</Text>
              <View style={styles.quickSelectGrid}>
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 100].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.quickSelectButton}
                    onPress={() => setRecentPercentile(value.toString())}
                  >
                    <Text style={styles.quickSelectText}>{value}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  examTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  previewSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },
  circlesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  circleItem: {
    alignItems: "center",
  },
  circleLabel: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  inputSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: "#000000",
  },
  percentSymbol: {
    fontSize: 18,
    color: "#8E8E93",
    marginRight: 16,
  },
  inputHelp: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  quickSelectSection: {
    marginTop: 20,
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  quickSelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  quickSelectText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 30,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#8E8E93",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerButton: {
    padding: 8,
  },
});