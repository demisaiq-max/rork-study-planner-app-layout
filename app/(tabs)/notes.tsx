import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Plus, Search, Calendar, Clock, CheckCircle, Trash2, Edit3, X } from "lucide-react-native";
import { useLanguage } from "@/hooks/language-context";
import { trpc } from "@/lib/trpc";

interface StudyNote {
  id: string;
  title: string;
  completed: boolean;
  subject?: string;
  due_date?: string;
  estimated_time?: number;
  priority?: "high" | "medium" | "low";
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function NotesScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyNote | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstimatedTime, setTaskEstimatedTime] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [taskDescription, setTaskDescription] = useState("");

  // Fetch study notes from database
  const studyNotesQuery = trpc.studyNotes.getStudyNotes.useQuery({
    subject: selectedSubject || undefined,
  });

  const createNoteMutation = trpc.studyNotes.createStudyNote.useMutation({
    onSuccess: () => {
      studyNotesQuery.refetch();
      setModalVisible(false);
    },
    onError: (error) => {
      Alert.alert(t('error') || "Error", error.message);
    },
  });

  const updateNoteMutation = trpc.studyNotes.updateStudyNote.useMutation({
    onSuccess: () => {
      studyNotesQuery.refetch();
      setModalVisible(false);
    },
    onError: (error) => {
      Alert.alert(t('error') || "Error", error.message);
    },
  });

  const deleteNoteMutation = trpc.studyNotes.deleteStudyNote.useMutation({
    onSuccess: () => {
      studyNotesQuery.refetch();
    },
    onError: (error) => {
      Alert.alert(t('error') || "Error", error.message);
    },
  });

  const tasks = studyNotesQuery.data || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !selectedSubject || task.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [tasks, searchQuery, selectedSubject]);

  // Get unique subjects from tasks
  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(new Set(tasks.map(task => task.subject).filter(Boolean)));
    return uniqueSubjects as string[];
  }, [tasks]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskSubject("");
    setTaskDueDate("");
    setTaskEstimatedTime("");
    setTaskPriority("medium");
    setTaskDescription("");
    setModalVisible(true);
  };

  const openEditModal = (task: StudyNote) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskSubject(task.subject || "");
    setTaskDueDate(task.due_date || "");
    setTaskEstimatedTime(task.estimated_time?.toString() || "");
    setTaskPriority(task.priority || "medium");
    setTaskDescription(task.description || "");
    setModalVisible(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert(t('error') || "Error", t('taskTitleError') || "Task title is required");
      return;
    }

    const taskData = {
      title: taskTitle.trim(),
      subject: taskSubject.trim() || undefined,
      dueDate: taskDueDate.trim() || undefined,
      estimatedTime: taskEstimatedTime ? parseInt(taskEstimatedTime) : undefined,
      priority: taskPriority,
      description: taskDescription.trim() || undefined,
    };

    if (editingTask) {
      // Update existing task
      updateNoteMutation.mutate({
        id: editingTask.id,
        ...taskData,
      });
    } else {
      // Add new task
      createNoteMutation.mutate(taskData);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      t('deleteTask') || "Delete Task",
      t('deleteTaskConfirm') || "Are you sure you want to delete this task?",
      [
        { text: t('cancel') || "Cancel", style: "cancel" },
        {
          text: t('delete') || "Delete",
          style: "destructive",
          onPress: () => {
            deleteNoteMutation.mutate({ id: taskId });
          },
        },
      ]
    );
  };

  const handleToggleTask = (task: StudyNote) => {
    updateNoteMutation.mutate({
      id: task.id,
      completed: !task.completed,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('studyNotes') || t('notes')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchTasks') || "Search tasks..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>{t('totalTasks') || "Total Tasks"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>{t('completed') || "Completed"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completionRate}%</Text>
          <Text style={styles.statLabel}>{t('progress') || "Progress"}</Text>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.subjectFilter}
        contentContainerStyle={styles.subjectFilterContent}
      >
        <TouchableOpacity
          style={[styles.subjectChip, !selectedSubject && styles.subjectChipActive]}
          onPress={() => setSelectedSubject(null)}
        >
          <Text style={[styles.subjectChipText, !selectedSubject && styles.subjectChipTextActive]}>
            {t('all') || "All"}
          </Text>
        </TouchableOpacity>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={[styles.subjectChip, selectedSubject === subject && styles.subjectChipActive]}
            onPress={() => setSelectedSubject(subject)}
          >
            <Text style={[styles.subjectChipText, selectedSubject === subject && styles.subjectChipTextActive]}>
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.tasksList}
        contentContainerStyle={styles.tasksContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <TouchableOpacity
              style={styles.taskContent}
              onPress={() => handleToggleTask(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <View style={styles.taskMetaItem}>
                      <Calendar size={12} color="#8E8E93" />
                      <Text style={styles.taskMetaText}>{task.due_date || t('noDueDate') || "No due date"}</Text>
                    </View>
                    <View style={styles.taskMetaItem}>
                      <Clock size={12} color="#8E8E93" />
                      <Text style={styles.taskMetaText}>{task.estimated_time || "0"} {t('min') || "min"}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxChecked]}>
                  {task.completed && <CheckCircle size={20} color="#34C759" />}
                </View>
              </View>
              {task.subject && (
                <View style={styles.taskSubject}>
                  <Text style={styles.taskSubjectText}>{task.subject}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(task)}
              >
                <Edit3 size={16} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteTask(task.id)}
              >
                <Trash2 size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTask ? (t('editTask') || "Edit Task") : (t('addNewTask') || "Add New Task")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('taskTitle')} *</Text>
                <TextInput
                  style={styles.input}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder={t('taskTitlePlaceholder')}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('subject') || "Subject"}</Text>
                <TextInput
                  style={styles.input}
                  value={taskSubject}
                  onChangeText={setTaskSubject}
                  placeholder={t('enterSubject') || "Enter subject"}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('dueDate') || "Due Date"}</Text>
                <TextInput
                  style={styles.input}
                  value={taskDueDate}
                  onChangeText={setTaskDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('estimatedTime') || "Estimated Time"} ({t('minutes') || "minutes"})</Text>
                <TextInput
                  style={styles.input}
                  value={taskEstimatedTime}
                  onChangeText={setTaskEstimatedTime}
                  placeholder={t('enterTimeInMinutes') || "Enter time in minutes"}
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('priority') || "Priority"}</Text>
                <View style={styles.priorityButtons}>
                  {(["high", "medium", "low"] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        taskPriority === priority && styles.priorityButtonActive,
                      ]}
                      onPress={() => setTaskPriority(priority)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          taskPriority === priority && styles.priorityButtonTextActive,
                        ]}
                      >
                        {t(priority)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder={t('taskDescPlaceholder')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel') || "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTask}
              >
                <Text style={styles.saveButtonText}>
                  {editingTask ? (t('update') || "Update") : (t('add') || "Add")} {t('task') || "Task"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 20,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E5EA",
  },
  subjectFilter: {
    marginTop: 15,
    paddingLeft: 20,
    maxHeight: 40,
  },
  subjectFilterContent: {
    paddingRight: 20,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  subjectChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  subjectChipText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  subjectChipTextActive: {
    color: "#FFFFFF",
  },
  tasksList: {
    flex: 1,
    marginTop: 15,
  },
  tasksContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#8E8E93",
  },
  taskMeta: {
    flexDirection: "row",
    gap: 16,
  },
  taskMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckboxChecked: {
    borderColor: "#34C759",
    backgroundColor: "#34C75910",
  },
  taskSubject: {
    marginTop: 8,
  },
  taskSubjectText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  taskContent: {
    flex: 1,
  },
  taskActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F2F2F7",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    alignItems: "center",
  },
  priorityButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },
  priorityButtonTextActive: {
    color: "#FFFFFF",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});