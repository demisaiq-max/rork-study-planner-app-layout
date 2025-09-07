import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Edit2, Trash2, Plus, X, Calendar } from "lucide-react-native";
import { useStudyStore } from "@/hooks/study-store";
import { useLanguage } from "@/hooks/language-context";
import FormattedDateInput from "@/components/FormattedDateInput";

export default function ExamManagementScreen() {
  const { dDays, addDDay, updateDDay, removeDDay } = useStudyStore();
  const { t } = useLanguage();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDate, setNewExamDate] = useState("");
  const [newExamDescription, setNewExamDescription] = useState("");
  const [newExamPriority, setNewExamPriority] = useState<"high" | "medium" | "low">("medium");
  const [editExamTitle, setEditExamTitle] = useState("");
  const [editExamDate, setEditExamDate] = useState("");
  const [editExamDescription, setEditExamDescription] = useState("");
  const [editExamPriority, setEditExamPriority] = useState<"high" | "medium" | "low">("medium");
  
  // Calculate days left for display
  const calculateDaysLeft = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const timeDiff = examDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysLeft;
  };

  const handleAddExam = () => {
    if (!newExamTitle.trim() || !newExamDate.trim()) {
      Alert.alert(t('error'), t('examFormError'));
      return;
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newExamDate)) {
      Alert.alert(t('error'), 'Please enter date in YYYY-MM-DD format');
      return;
    }

    const daysLeft = calculateDaysLeft(newExamDate);

    if (daysLeft < 0) {
      Alert.alert(t('error'), t('futureDateError'));
      return;
    }

    addDDay({
      title: newExamTitle,
      date: newExamDate,
      daysLeft: daysLeft,
      description: newExamDescription,
      priority: newExamPriority
    });

    setNewExamTitle("");
    setNewExamDate("");
    setNewExamDescription("");
    setNewExamPriority("medium");
    setShowAddModal(false);
  };

  const handleEditExam = () => {
    if (!editExamTitle.trim() || !editExamDate.trim()) {
      Alert.alert(t('error'), t('examFormError'));
      return;
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editExamDate)) {
      Alert.alert(t('error'), 'Please enter date in YYYY-MM-DD format');
      return;
    }

    const daysLeft = calculateDaysLeft(editExamDate);

    if (daysLeft < 0) {
      Alert.alert(t('error'), t('futureDateError'));
      return;
    }

    if (updateDDay) {
      updateDDay(editingExam.id, {
        title: editExamTitle,
        date: editExamDate,
        daysLeft: daysLeft,
        description: editExamDescription,
        priority: editExamPriority
      });
    }

    setEditingExam(null);
    setEditExamTitle("");
    setEditExamDate("");
    setEditExamDescription("");
    setEditExamPriority("medium");
    setShowEditModal(false);
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      t('deleteExam'),
      t('deleteExamConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete'), 
          style: "destructive",
          onPress: () => {
            if (removeDDay) {
              removeDDay(examId);
            }
          }
        }
      ]
    );
  };

  const openEditModal = (exam: any) => {
    setEditingExam(exam);
    setEditExamTitle(exam.title);
    setEditExamDate(exam.date);
    setEditExamDescription(exam.description || "");
    setEditExamPriority(exam.priority || "medium");
    setShowEditModal(true);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "#FF3B30";
      case "low":
        return "#34C759";
      default:
        return "#FF9500";
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t('examManagement'),
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
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('manageExams')}</Text>
            <Text style={styles.headerSubtitle}>{t('manageExamsDesc')}</Text>
          </View>

          <View style={styles.examsList}>
            {dDays?.map((exam) => (
              <View key={exam.id} style={styles.examCard}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(exam.priority) }]} />
                <View style={styles.examContent}>
                  <View style={styles.examInfo}>
                    <View style={styles.examTextContainer}>
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      {exam.description && (
                        <Text style={styles.examDescription} numberOfLines={2}>{exam.description}</Text>
                      )}
                      <Text style={styles.examDate}>{exam.date}</Text>
                    </View>
                    <View style={styles.daysContainer}>
                      <Text style={[
                        styles.daysLeft,
                        calculateDaysLeft(exam.date) <= 30 && styles.daysLeftUrgent
                      ]}>
                        D-{calculateDaysLeft(exam.date)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.examActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openEditModal(exam)}
                    >
                      <Edit2 size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteExam(exam.id)}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {(!dDays || dDays.length === 0) && (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#C7C7CC" />
                <Text style={styles.emptyTitle}>{t('noExams')}</Text>
                <Text style={styles.emptySubtitle}>{t('noExamsDesc')}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t('addNewExam')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

        {/* Add Exam Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('addExamTitle')}</Text>
              <TouchableOpacity onPress={handleAddExam}>
                <Text style={styles.saveButton}>{t('save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examName')}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newExamTitle}
                    onChangeText={setNewExamTitle}
                    placeholder={t('examNamePlaceholder')}
                    placeholderTextColor="#8E8E93"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examDate')}</Text>
                  <FormattedDateInput
                    value={newExamDate}
                    onChangeText={setNewExamDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examDescription')}</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={newExamDescription}
                    onChangeText={setNewExamDescription}
                    placeholder={t('examDescPlaceholder')}
                    placeholderTextColor="#8E8E93"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('importance')}</Text>
                  <View style={styles.priorityButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityHigh,
                        newExamPriority === "high" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setNewExamPriority("high")}
                    >
                      <Text style={styles.priorityButtonText}>{t('high')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityMedium,
                        newExamPriority === "medium" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setNewExamPriority("medium")}
                    >
                      <Text style={styles.priorityButtonText}>{t('medium')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityLow,
                        newExamPriority === "low" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setNewExamPriority("low")}
                    >
                      <Text style={styles.priorityButtonText}>{t('low')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Exam Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('editExam')}</Text>
              <TouchableOpacity onPress={handleEditExam}>
                <Text style={styles.saveButton}>{t('save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examName')}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editExamTitle}
                    onChangeText={setEditExamTitle}
                    placeholder={t('examNamePlaceholder')}
                    placeholderTextColor="#8E8E93"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examDate')}</Text>
                  <FormattedDateInput
                    value={editExamDate}
                    onChangeText={setEditExamDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('examDescription')}</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editExamDescription}
                    onChangeText={setEditExamDescription}
                    placeholder={t('examDescPlaceholder')}
                    placeholderTextColor="#8E8E93"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('importance')}</Text>
                  <View style={styles.priorityButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityHigh,
                        editExamPriority === "high" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setEditExamPriority("high")}
                    >
                      <Text style={styles.priorityButtonText}>{t('high')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityMedium,
                        editExamPriority === "medium" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setEditExamPriority("medium")}
                    >
                      <Text style={styles.priorityButtonText}>{t('medium')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priorityButton, 
                        styles.priorityLow,
                        editExamPriority === "low" && styles.priorityButtonSelected
                      ]}
                      onPress={() => setEditExamPriority("low")}
                    >
                      <Text style={styles.priorityButtonText}>{t('low')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 80,
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  examsList: {
    padding: 20,
  },
  examCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  priorityIndicator: {
    width: 4,
    backgroundColor: "#FF9500",
  },
  examContent: {
    flex: 1,
    padding: 16,
  },
  examInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  examTextContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 4,
    lineHeight: 18,
  },
  examDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  daysContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  daysLeft: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  daysLeftUrgent: {
    color: "#FF3B30",
  },
  examActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalContent: {
    padding: 20,
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
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    opacity: 0.7,
  },
  priorityButtonSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  priorityHigh: {
    backgroundColor: "#FF3B30",
  },
  priorityMedium: {
    backgroundColor: "#FF9500",
  },
  priorityLow: {
    backgroundColor: "#34C759",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});