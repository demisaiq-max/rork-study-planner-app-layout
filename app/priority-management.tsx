import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plus, Edit2, Trash2, X, Check, ChevronLeft } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useRouter, Stack } from 'expo-router';
import { useStudyStore } from '@/hooks/study-store';

export default function PriorityManagementScreen() {
  const { 
    priorityTasks, 
    addPriorityTask, 
    removePriorityTask, 
    updatePriorityTask, 
    togglePriorityTask 
  } = useStudyStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const { language } = useLanguage();
  const router = useRouter();

  const translations = {
    en: {
      title: 'Priority Management',
      addTask: 'Add Task',
      editTask: 'Edit Task',
      taskTitle: 'Task Title',
      subject: 'Subject',
      priority: 'Priority',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this task?',
      noTasks: 'No priority tasks yet',
      addFirstTask: 'Add your first priority task',
    },
    ko: {
      title: '우선순위 관리',
      addTask: '작업 추가',
      editTask: '작업 수정',
      taskTitle: '작업 제목',
      subject: '과목',
      priority: '우선순위',
      high: '높음',
      medium: '중간',
      low: '낮음',
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      confirmDelete: '이 작업을 삭제하시겠습니까?',
      noTasks: '우선순위 작업이 없습니다',
      addFirstTask: '첫 번째 우선순위 작업을 추가하세요',
    },
  };

  const t = translations[language];



  const handleAddTask = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskSubject('');
    setTaskPriority('high');
    setModalVisible(true);
  };

  const handleEditTask = (taskId: string) => {
    const task = priorityTasks?.find(t => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setTaskTitle(task.title);
      setTaskSubject(task.subject);
      setTaskPriority(task.priority);
      setModalVisible(true);
    }
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim() || !taskSubject.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (editingTaskId) {
      updatePriorityTask(editingTaskId, {
        title: taskTitle,
        subject: taskSubject,
        priority: taskPriority,
      });
    } else {
      addPriorityTask({
        title: taskTitle,
        subject: taskSubject,
        priority: taskPriority,
        completed: false,
      });
    }

    setModalVisible(false);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      t.delete,
      t.confirmDelete,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => removePriorityTask(taskId),
        },
      ]
    );
  };

  const handleToggleComplete = (taskId: string) => {
    togglePriorityTask(taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: t.title,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 10 }}>
              <ChevronLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleAddTask} style={{ paddingRight: 10 }}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(!priorityTasks || priorityTasks.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noTasks}</Text>
            <Text style={styles.emptySubtitle}>{t.addFirstTask}</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddTask}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyAddButtonText}>{t.addTask}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {priorityTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskContent}
                  onPress={() => handleToggleComplete(task.id)}
                >
                  <View style={styles.taskLeft}>
                    <View style={[
                      styles.checkbox,
                      task.completed && styles.checkboxCompleted
                    ]}>
                      {task.completed && <Check size={16} color="#FFFFFF" />}
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted
                      ]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskSubject}>{task.subject}</Text>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(task.priority) + '20' }
                        ]}>
                          <Text style={[
                            styles.priorityText,
                            { color: getPriorityColor(task.priority) }
                          ]}>
                            {t[task.priority]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditTask(task.id)}
                  >
                    <Edit2 size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTaskId ? t.editTask : t.addTask}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.taskTitle}</Text>
                <TextInput
                  style={styles.input}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder={t.taskTitle}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.subject}</Text>
                <TextInput
                  style={styles.input}
                  value={taskSubject}
                  onChangeText={setTaskSubject}
                  placeholder={t.subject}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.priority}</Text>
                <View style={styles.priorityOptions}>
                  {(['high', 'medium', 'low'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        taskPriority === priority && styles.priorityOptionSelected,
                        { borderColor: taskPriority === priority ? getPriorityColor(priority) : '#E5E5EA' }
                      ]}
                      onPress={() => setTaskPriority(priority)}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        taskPriority === priority && { color: getPriorityColor(priority) }
                      ]}>
                        {t[priority]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTask}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksList: {
    padding: 20,
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  taskContent: {
    flex: 1,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskSubject: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});