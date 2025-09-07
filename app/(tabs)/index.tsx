import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, User, X, Check, Edit2, Trash2, ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import CircularProgress from "@/components/CircularProgress";
import DayCard from "@/components/DayCard";
import CalendarWidget from "@/components/CalendarWidget";
import TaskItem from "@/components/TaskItem";
import { useStudyStore } from "@/hooks/study-store";
import { useUser } from "@/hooks/user-context";
import { useLanguage } from "@/hooks/language-context";
import FormattedDateInput from "@/components/FormattedDateInput";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { 
    tasks, 
    dDays, 
    todayStudyTime, 
    targetStudyTime,
    toggleTask,
    updateStudyTime,
    addDDay,
    addTask,
    subjects,
    subjectGrades,
    visibleSubjects,
    toggleSubjectVisibility,
    updateSubjectGrade,
    priorityTasks,
    addPriorityTask,
    removePriorityTask,
    brainDumpItems,
    addBrainDumpItem,
    updateBrainDumpItem,
    deleteBrainDumpItem,
    toggleBrainDumpItem,
    isLoading
  } = useStudyStore();
  const { user } = useUser();
  const { t } = useLanguage();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDate, setNewExamDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showBrainDumpModal, setShowBrainDumpModal] = useState(false);

  const [editingBrainDumpId, setEditingBrainDumpId] = useState<string | null>(null);
  const [editingBrainDumpText, setEditingBrainDumpText] = useState("");
  const [newBrainDumpText, setNewBrainDumpText] = useState("");
  const [showEditGradesModal, setShowEditGradesModal] = useState(false);
  const [editingGrades, setEditingGrades] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showEditGradesModal && subjectGrades) {
      setEditingGrades({...subjectGrades});
    }
  }, [showEditGradesModal, subjectGrades]);

  const progressPercentage = (todayStudyTime / targetStudyTime) * 100;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

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

    const examDate = new Date(newExamDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const timeDiff = examDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      Alert.alert(t('error'), t('futureDateError'));
      return;
    }

    addDDay({
      title: newExamTitle,
      date: newExamDate,
      daysLeft: daysLeft
    });

    setNewExamTitle("");
    setNewExamDate("");
    setShowAddExamModal(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert(t('error'), t('taskTitleError'));
      return;
    }

    if (isPriority && (priorityTasks?.length || 0) >= 3) {
      Alert.alert(t('error'), t('priorityLimitError'));
      return;
    }

    const newTask = {
      title: newTaskTitle,
      completed: false,
      description: newTaskDescription,
      priority: isPriority ? "high" as const : undefined
    };

    addTask(newTask);
    
    if (isPriority) {
      addPriorityTask({
        title: newTaskTitle,
        description: newTaskDescription
      });
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setIsPriority(false);
    setShowAddTaskModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.avatar}>
              <User size={24} color="#8E8E93" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.examType}>{t('examType')}</Text>
              <Text style={styles.userName}>{user?.name || t('userName')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Study Progress Card */}
        <View style={styles.timerCard}>
          <TouchableOpacity 
            style={styles.mockExamHeader} 
            activeOpacity={0.7}
            onPress={() => router.push('/exam-selection')}
          >
            <Text style={styles.mockExamTitle}>실시간 모의고사 채점하기</Text>
            <ArrowUpRight size={18} color="#666666" />
          </TouchableOpacity>
          
          <View style={styles.progressSection}>
            <View style={styles.leftTextContainer}>
              <Text style={styles.leftText}>아구몬 님의</Text>
              <Text style={styles.leftText}>현재 성적</Text>
            </View>
            
            <View style={styles.circlesContainer}>
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={89}
                  size={70}
                  strokeWidth={6}
                  color="#333333"
                  centerText="89"
                />
                <Text style={styles.circleLabel}>목표 백분위</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={50}
                  size={70}
                  strokeWidth={6}
                  color="#E5E5EA"
                  centerText="50"
                />
                <Text style={styles.circleLabel}>평균 백분위</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={68}
                  size={70}
                  strokeWidth={6}
                  color="#8E8E93"
                  centerText="68"
                />
                <Text style={styles.circleLabel}>최근 백분위</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject Grades Section */}
        <View style={styles.subjectsCard}>
          <View style={styles.subjectsHeader}>
            <Text style={styles.subjectsTitle}>{t('subjectsTitle')}</Text>
            <TouchableOpacity onPress={() => setShowEditGradesModal(true)}>
              <Text style={styles.subjectsEditButton}>{t('editButton')}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
            {subjects?.map((subject) => {
              const currentVisibleSubjects = visibleSubjects || [];
              const isVisible = currentVisibleSubjects.includes(subject);
              const gradeValue = subjectGrades?.[subject];
              const grade = gradeValue ? gradeValue.toString() : t('undetermined');
              const isSelected = selectedSubject === subject;
              
              return (
                <TouchableOpacity 
                  key={subject}
                  style={[
                    styles.subjectCard, 
                    !isVisible && styles.subjectCardHidden,
                    isSelected && styles.subjectCardSelected
                  ]}
                  onPress={() => {
                    if (currentVisibleSubjects.includes(subject)) {
                      setSelectedSubject(isSelected ? null : subject);
                    } else {
                      toggleSubjectVisibility(subject);
                    }
                  }}
                >
                  <Text style={[
                    styles.subjectName, 
                    !isVisible && styles.subjectNameHidden,
                    isSelected && styles.subjectNameSelected
                  ]}>
                    {t(subject.toLowerCase())}
                  </Text>
                  <Text style={[
                    styles.subjectGrade, 
                    !isVisible && styles.subjectGradeHidden,
                    isSelected && styles.subjectGradeSelected
                  ]}>
                    {gradeValue ? `${grade}${t('gradeUnit')}` : grade}
                  </Text>
                  {isVisible && (
                    <View style={[styles.subjectIndicator, isSelected && styles.subjectIndicatorSelected]} />
                  )}
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity style={styles.expectedGradeCard}>
              <Text style={styles.expectedGradeText}>{t('expectedGrade')}</Text>
              <Text style={styles.expectedGradeValue}>2{t('gradeUnit')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* D-Day Cards */}
        <View style={styles.dDaySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dDayScroll}
          >
            {dDays?.map((dDay) => {
              const examDate = new Date(dDay.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              examDate.setHours(0, 0, 0, 0);
              const timeDiff = examDate.getTime() - today.getTime();
              const calculatedDaysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
              const validDaysLeft = !isNaN(calculatedDaysLeft) && isFinite(calculatedDaysLeft) ? calculatedDaysLeft : dDay.daysLeft || 0;
              
              return (
                <TouchableOpacity
                  key={dDay.id}
                  onPress={() => router.push('/exam-management')}
                >
                  <DayCard 
                    {...dDay} 
                    daysLeft={validDaysLeft}
                    priority={dDay.priority}
                  />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity 
              style={styles.addDDayCard}
              onPress={() => router.push('/exam-management')}
            >
              <Plus size={32} color="#8E8E93" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Calendar */}
        <CalendarWidget currentDate={currentTime} />

        {/* Priority Tasks */}
        <TouchableOpacity 
          style={styles.tasksSection}
          onPress={() => router.push('/priority-management')}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{t('priorityTasksTitle')}</Text>
            <ArrowUpRight size={20} color="#8E8E93" />
          </View>
          
          <View style={styles.tasksList}>
            {priorityTasks?.slice(0, 3).map((task: { title: string; description?: string }, index: number) => (
              <View key={index} style={styles.priorityTaskItem}>
                <View style={styles.priorityTaskContent}>
                  <View style={styles.priorityCheckbox}>
                    <View style={styles.priorityDot} />
                  </View>
                  <View style={styles.priorityTaskText}>
                    <Text style={styles.priorityTaskTitle}>{task.title}</Text>
                    {task.description && (
                      <Text style={styles.priorityTaskDescription}>{task.description}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
            
            {(!priorityTasks || priorityTasks.length === 0) && (
              <View style={styles.emptyPriorityTasks}>
                <Text style={styles.emptyPriorityText}>{t('emptyPriorityText')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Brain Dump Section */}
        <TouchableOpacity 
          style={styles.brainDumpSection}
          onPress={() => router.push('/brain-manager')}
          activeOpacity={0.8}
        >
          <Text style={styles.brainDumpTitle}>Brain Dump</Text>
          
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>{t('morningAdjustment')}</Text>
              <Text style={styles.goalBadge}>V</Text>
            </View>
          </View>

          {brainDumpItems?.slice(0, 6).map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.goalItem}
              onPress={() => toggleBrainDumpItem(item.id)}
            >
              <Text style={styles.goalText}>{item.title}</Text>
              <View style={[styles.checkbox, item.completed && styles.checkboxChecked]} />
            </TouchableOpacity>
          ))}
          
          {brainDumpItems && brainDumpItems.length > 6 && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => setShowBrainDumpModal(true)}
            >
              <Text style={styles.seeAllText}>See All ({brainDumpItems.length})</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Exam Modal */}
      <Modal
        visible={showAddExamModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddExamModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddExamModal(false)}>
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
                  placeholder={t('examDescPlaceholder')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('importance')}</Text>
                <View style={styles.priorityButtons}>
                  <TouchableOpacity style={[styles.priorityButton, styles.priorityHigh]}>
                    <Text style={styles.priorityButtonText}>{t('high')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.priorityButton, styles.priorityMedium]}>
                    <Text style={styles.priorityButtonText}>{t('medium')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.priorityButton, styles.priorityLow]}>
                    <Text style={styles.priorityButtonText}>{t('low')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('addTaskTitle')}</Text>
            <TouchableOpacity onPress={handleAddTask}>
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
                <Text style={styles.inputLabel}>{t('taskTitle')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder={t('taskTitlePlaceholder')}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('description')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  placeholder={t('taskDescPlaceholder')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <TouchableOpacity 
                  style={styles.priorityCheckboxContainer}
                  onPress={() => {
                    if ((priorityTasks?.length || 0) >= 3 && !isPriority) {
                      Alert.alert(t('notification'), t('priorityLimitError'));
                      return;
                    }
                    setIsPriority(!isPriority);
                  }}
                >
                  <View style={[styles.checkbox, isPriority && styles.checkboxChecked]}>
                    {isPriority && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.priorityCheckboxLabel}>
                    {t('setPriority')} ({priorityTasks?.length || 0}/3)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Brain Dump Modal */}
      <Modal
        visible={showBrainDumpModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBrainDumpModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBrainDumpModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Brain Dump</Text>
            <TouchableOpacity 
              onPress={() => {
                if (newBrainDumpText.trim()) {
                  addBrainDumpItem(newBrainDumpText.trim());
                  setNewBrainDumpText("");
                }
              }}
            >
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  value={newBrainDumpText}
                  onChangeText={setNewBrainDumpText}
                  placeholder="Add new brain dump item..."
                  placeholderTextColor="#8E8E93"
                  onSubmitEditing={() => {
                    if (newBrainDumpText.trim()) {
                      addBrainDumpItem(newBrainDumpText.trim());
                      setNewBrainDumpText("");
                    }
                  }}
                />
              </View>
              
              {brainDumpItems?.map((item) => (
                <View key={item.id} style={styles.brainDumpItem}>
                  {editingBrainDumpId === item.id ? (
                    <View style={styles.editingContainer}>
                      <TextInput
                        style={styles.editingInput}
                        value={editingBrainDumpText}
                        onChangeText={setEditingBrainDumpText}
                        onSubmitEditing={() => {
                          updateBrainDumpItem(item.id, editingBrainDumpText);
                          setEditingBrainDumpId(null);
                          setEditingBrainDumpText("");
                        }}
                        autoFocus
                      />
                      <View style={styles.editingActions}>
                        <TouchableOpacity 
                          onPress={() => {
                            updateBrainDumpItem(item.id, editingBrainDumpText);
                            setEditingBrainDumpId(null);
                            setEditingBrainDumpText("");
                          }}
                          style={styles.saveEditButton}
                        >
                          <Check size={16} color="#34C759" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingBrainDumpId(null);
                            setEditingBrainDumpText("");
                          }}
                          style={styles.cancelEditButton}
                        >
                          <X size={16} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.brainDumpItemContent}>
                      <TouchableOpacity 
                        style={styles.brainDumpCheckbox}
                        onPress={() => toggleBrainDumpItem(item.id)}
                      >
                        <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                          {item.completed && <Check size={14} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                      
                      <Text style={[styles.brainDumpText, item.completed && styles.brainDumpTextCompleted]}>
                        {item.title}
                      </Text>
                      
                      <View style={styles.brainDumpActions}>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingBrainDumpId(item.id);
                            setEditingBrainDumpText(item.title);
                          }}
                          style={styles.brainDumpEditButton}
                        >
                          <Edit2 size={16} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            Alert.alert(
                              "Delete Item",
                              "Are you sure you want to delete this brain dump item?",
                              [
                                { text: "Cancel", style: "cancel" },
                                { 
                                  text: "Delete", 
                                  style: "destructive",
                                  onPress: () => deleteBrainDumpItem(item.id)
                                }
                              ]
                            );
                          }}
                          style={styles.deleteButton}
                        >
                          <Trash2 size={16} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              
              {(!brainDumpItems || brainDumpItems.length === 0) && (
                <View style={styles.emptyBrainDump}>
                  <Text style={styles.emptyBrainDumpText}>No brain dump items yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Grades Modal */}
      <Modal
        visible={showEditGradesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditGradesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditGradesModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('editGrades')}</Text>
            <TouchableOpacity 
              onPress={() => {
                Object.entries(editingGrades).forEach(([subject, grade]) => {
                  if (updateSubjectGrade) {
                    updateSubjectGrade(subject, grade);
                  }
                });
                setShowEditGradesModal(false);
              }}
            >
              <Text style={styles.saveButton}>{t('save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              {subjects?.map((subject) => (
                <View key={subject} style={styles.gradeEditItem}>
                  <Text style={styles.gradeEditLabel}>{t(subject.toLowerCase())}</Text>
                  <View style={styles.gradeSelector}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.gradeOption,
                          editingGrades[subject] === grade && styles.gradeOptionSelected
                        ]}
                        onPress={() => {
                          setEditingGrades(prev => ({
                            ...prev,
                            [subject]: grade
                          }));
                        }}
                      >
                        <Text style={[
                          styles.gradeOptionText,
                          editingGrades[subject] === grade && styles.gradeOptionTextSelected
                        ]}>
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    paddingBottom: 20,
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileInfo: {
    justifyContent: "center",
  },
  examType: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F3FF",
    justifyContent: "center",
    alignItems: "center",
  },

  timerCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mockExamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    position: "relative",
  },
  mockExamTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginRight: 6,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftTextContainer: {
    flex: 0.25,
  },
  leftText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333333",
    lineHeight: 18,
  },
  circlesContainer: {
    flex: 0.75,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  circleItem: {
    alignItems: "center",
  },
  circleLabel: {
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
    marginTop: 6,
  },

  dDaySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dDayScroll: {
    flexDirection: "row",
    gap: 12,
  },
  addDDayCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tasksSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  tasksList: {
    gap: 12,
  },
  goalsSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  goalsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: "#8E8E93",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  goalBadge: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  goalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  goalText: {
    fontSize: 14,
    color: "#000000",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C7C7CC",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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
    height: 100,
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
  subjectsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  subjectsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  subjectsEditButton: {
    fontSize: 14,
    color: "#007AFF",
  },
  subjectsScroll: {
    flexDirection: "row",
  },
  subjectCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  subjectCardHidden: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E5EA",
  },
  subjectCardSelected: {
    backgroundColor: "#E8F3FF",
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  subjectNameHidden: {
    color: "#8E8E93",
  },
  subjectNameSelected: {
    color: "#007AFF",
    fontWeight: "700",
  },
  subjectGrade: {
    fontSize: 12,
    color: "#007AFF",
  },
  subjectGradeHidden: {
    color: "#8E8E93",
  },
  subjectGradeSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  subjectIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#007AFF",
    marginTop: 4,
  },
  subjectIndicatorSelected: {
    backgroundColor: "#007AFF",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expectedGradeCard: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: "center",
  },
  expectedGradeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  expectedGradeValue: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  priorityTaskItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  priorityTaskContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priorityCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
  },
  priorityTaskText: {
    flex: 1,
  },
  priorityTaskTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  priorityTaskDescription: {
    fontSize: 12,
    color: "#8E8E93",
  },
  emptyPriorityTasks: {
    padding: 20,
    alignItems: "center",
  },
  emptyPriorityText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  priorityCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityCheckboxLabel: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  brainDumpSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  brainDumpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  seeAllButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  brainDumpItem: {
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  brainDumpItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  brainDumpCheckbox: {
    marginRight: 12,
  },
  brainDumpText: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
  },
  brainDumpTextCompleted: {
    textDecorationLine: "line-through",
    color: "#8E8E93",
  },
  brainDumpActions: {
    flexDirection: "row",
    gap: 8,
  },
  brainDumpEditButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  editingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editingInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  editingActions: {
    flexDirection: "row",
    gap: 4,
  },
  saveEditButton: {
    padding: 4,
  },
  cancelEditButton: {
    padding: 4,
  },
  emptyBrainDump: {
    padding: 20,
    alignItems: "center",
  },
  emptyBrainDumpText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  gradeEditItem: {
    marginBottom: 24,
  },
  gradeEditLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  gradeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gradeOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  gradeOptionSelected: {
    backgroundColor: "#E8F3FF",
    borderColor: "#007AFF",
  },
  gradeOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
  },
  gradeOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  priorityTaskActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: "auto",
  },
  priorityEditButton: {
    padding: 4,
  },
  priorityDeleteButton: {
    padding: 4,
  },
  editingPriorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editingPriorityInputs: {
    flex: 1,
    gap: 8,
  },
  editingPriorityTitleInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  editingPriorityDescInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  editingPriorityActions: {
    flexDirection: "row",
    gap: 4,
  },
});