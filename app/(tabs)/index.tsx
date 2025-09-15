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
import { Plus, User, X, Check, Edit2, Trash2, ArrowUpRight, Database } from "lucide-react-native";
import { router } from "expo-router";
import { SignedIn, SignedOut, useUser as useClerkUser, useAuth } from "@clerk/clerk-expo";
import { SignOutButton } from "@/components/SignOutButton";
import CircularProgress from "@/components/CircularProgress";
import DayCard from "@/components/DayCard";
import CalendarWidget from "@/components/CalendarWidget";
import TaskItem from "@/components/TaskItem";
import { useStudyStore } from "@/hooks/study-store";
import { useUser } from "@/hooks/user-context";
import { useLanguage } from "@/hooks/language-context";
import { trpc, formatTRPCError } from "@/lib/trpc";
import FormattedDateInput from "@/components/FormattedDateInput";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { 
    tasks, 
    todayStudyTime, 
    targetStudyTime,
    toggleTask,
    togglePriorityTask,
    updateStudyTime,
    addTask,
    subjects,
    subjectGrades,
    visibleSubjects,
    toggleSubjectVisibility,
    updateSubjectGrade,
    priorityTasks,
    addPriorityTask,
    removePriorityTask,
    isLoading
  } = useStudyStore();
  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { t, language } = useLanguage();

  console.log('🏠 Home Screen - Auth Status:', { isLoaded, isSignedIn, hasClerkUser: !!clerkUser });
  
  // Fetch exams from database
  const { data: exams, isLoading: isLoadingExams, refetch: refetchExams } = trpc.exams.getUserExams.useQuery(
    { userId: user?.id || '550e8400-e29b-41d4-a716-446655440000' },
    { 
      enabled: !!user?.id
    }
  );
  
  // Fetch graded exams
  const { data: gradedExams, isLoading: isLoadingGradedExams, error: gradedExamsError, refetch: refetchGradedExams } = trpc.tests.getLatestTestResults.useQuery(
    user?.id || 'default-user',
    { 
      enabled: !!user?.id,
      retry: false
    }
  );
  
  // Fetch brain dumps from database
  const { data: brainDumps, isLoading: isLoadingBrainDumps, error: brainDumpsError, refetch: refetchBrainDumps } = trpc.brainDumps.getBrainDumps.useQuery(
    { limit: 10 },
    { 
      enabled: !!user?.id,
      retry: 1
    }
  );
  
  // Fetch priority tasks from database
  const { data: dbPriorityTasks, isLoading: isLoadingPriorityTasks, refetch: refetchPriorityTasks } = trpc.priorityTasks.getPriorityTasks.useQuery(
    { userId: user?.id || '' },
    { 
      enabled: !!user?.id,
      retry: 1
    }
  );
  
  // Create brain dump mutation
  const createBrainDumpMutation = trpc.brainDumps.createBrainDump.useMutation({
    onSuccess: () => {
      refetchBrainDumps();
    },
  });
  
  // Update brain dump mutation
  const updateBrainDumpMutation = trpc.brainDumps.updateBrainDump.useMutation({
    onSuccess: () => {
      refetchBrainDumps();
    },
  });
  
  // Delete brain dump mutation
  const deleteBrainDumpMutation = trpc.brainDumps.deleteBrainDump.useMutation({
    onSuccess: () => {
      refetchBrainDumps();
    },
  });
  
  // Update priority task mutation
  const updatePriorityTaskMutation = trpc.priorityTasks.updatePriorityTask.useMutation({
    onSuccess: () => {
      refetchPriorityTasks();
    },
  });
  
  // Create exam mutation
  const createExamMutation = trpc.exams.createExam.useMutation({
    onSuccess: () => {
      refetchExams();
      setShowAddExamModal(false);
      setNewExamTitle("");
      setNewExamDate("");
    },
    onError: (error) => {
      Alert.alert(t('error'), error.message);
    }
  });
  
  // Seed exam data for test user on mount
  useEffect(() => {
    const userId = user?.id || '550e8400-e29b-41d4-a716-446655440000';
    if (exams && exams.length === 0 && !isLoadingExams && user?.id) {

    }
  }, [exams, isLoadingExams, user?.id]);
  

  
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
  const [currentStats, setCurrentStats] = useState({
    targetPercentile: 140,
    averagePercentile: 0,
    recentPercentile: 0,
  });
  const [selectedGradedExam, setSelectedGradedExam] = useState<any>(null);
  
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

  // Update stats when a graded exam is selected
  useEffect(() => {
    if (selectedGradedExam && gradedExams) {
      // When a specific exam is selected, show stats for that subject only
      const selectedSubject = selectedGradedExam.tests?.subject;
      const subjectExams = gradedExams.filter((exam: any) => exam.tests?.subject === selectedSubject);
      
      // Calculate stats for the selected subject
      const subjectStandardScores = subjectExams.map((exam: any) => exam.standard_score || 0).filter(s => s > 0);
      const subjectPercentiles = subjectExams.map((exam: any) => exam.percentile || 0).filter(p => p > 0);
      
      const averageStandardScore = subjectStandardScores.length > 0 
        ? Math.round(subjectStandardScores.reduce((sum, score) => sum + score, 0) / subjectStandardScores.length)
        : 0;
      
      const averagePercentile = subjectPercentiles.length > 0 
        ? Math.round(subjectPercentiles.reduce((sum, percentile) => sum + percentile, 0) / subjectPercentiles.length)
        : 0;
      
      // Target score: highest achieved standard score in this subject + 5, or 140 if no data
      const maxStandardScore = subjectStandardScores.length > 0 ? Math.max(...subjectStandardScores) : 0;
      const targetScore = maxStandardScore > 0 ? Math.min(maxStandardScore + 5, 150) : 140;
      
      // Recent percentile from the selected exam
      const recentPercentile = selectedGradedExam.percentile || 0;
      
      setCurrentStats({
        targetPercentile: targetScore,
        averagePercentile: averageStandardScore,
        recentPercentile: recentPercentile,
      });
    } else if (gradedExams && gradedExams.length > 0) {
      // Show overall stats when no specific exam is selected
      const allStandardScores = gradedExams.map((exam: any) => exam.standard_score || 0).filter(s => s > 0);
      const allPercentiles = gradedExams.map((exam: any) => exam.percentile || 0).filter(p => p > 0);
      
      const averageStandardScore = allStandardScores.length > 0 
        ? Math.round(allStandardScores.reduce((sum, score) => sum + score, 0) / allStandardScores.length)
        : 0;
      
      const averagePercentile = allPercentiles.length > 0 
        ? Math.round(allPercentiles.reduce((sum, percentile) => sum + percentile, 0) / allPercentiles.length)
        : 0;
      
      // Target score: highest achieved standard score across all subjects + 5, or 140 if no data
      const maxStandardScore = allStandardScores.length > 0 ? Math.max(...allStandardScores) : 0;
      const targetScore = maxStandardScore > 0 ? Math.min(maxStandardScore + 5, 150) : 140;
      
      // Most recent exam percentile (first in the sorted array)
      const recentPercentile = gradedExams[0]?.percentile || 0;
      
      setCurrentStats({
        targetPercentile: targetScore,
        averagePercentile: averageStandardScore,
        recentPercentile: recentPercentile,
      });
    } else {
      // Reset to default stats when no data
      setCurrentStats({
        targetPercentile: 140,
        averagePercentile: 0,
        recentPercentile: 0,
      });
    }
  }, [selectedGradedExam, gradedExams]);

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

    createExamMutation.mutate({
      userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
      title: newExamTitle,
      date: newExamDate,
      subject: 'General',
      priority: false
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert(t('error'), t('taskTitleError'));
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
        subject: newTaskDescription || 'General',
        priority: 'high' as const,
        completed: false
      });
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setIsPriority(false);
    setShowAddTaskModal(false);
  };

  return (
    <>
      <SignedOut>
        <View style={styles.authContainer}>
          <View style={styles.authContent}>
            <Text style={styles.authTitle}>Welcome to Study Buddy</Text>
            <Text style={styles.authSubtitle}>Sign in to access your study dashboard</Text>
            <TouchableOpacity 
              style={styles.authButton}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={styles.authButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.authButton, styles.authButtonSecondary]}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={[styles.authButtonText, styles.authButtonTextSecondary]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SignedOut>
      
      <SignedIn>
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
              <Text style={styles.userName}>{clerkUser?.emailAddresses?.[0]?.emailAddress || user?.name || t('userName')}</Text>
            </View>
          </TouchableOpacity>
          
          <SignedIn>
            <SignOutButton />
          </SignedIn>
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
                  percentage={Math.min((currentStats.targetPercentile / 150) * 100, 100)}
                  size={70}
                  strokeWidth={6}
                  color="#333333"
                  centerText={currentStats.targetPercentile.toString()}
                />
                <Text style={styles.circleLabel}>목표 표준점수</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={Math.min((currentStats.averagePercentile / 150) * 100, 100)}
                  size={70}
                  strokeWidth={6}
                  color="#E5E5EA"
                  centerText={currentStats.averagePercentile.toString()}
                />
                <Text style={styles.circleLabel}>평균 표준점수</Text>
              </View>
              
              <View style={styles.circleItem}>
                <CircularProgress 
                  percentage={currentStats.recentPercentile}
                  size={70}
                  strokeWidth={6}
                  color="#8E8E93"
                  centerText={currentStats.recentPercentile.toString()}
                />
                <Text style={styles.circleLabel}>최근 백분위</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Graded Exams Section */}
        <View style={styles.subjectsCard}>
          <View style={styles.subjectsHeader}>
            <Text style={styles.subjectsTitle}>Graded Exams</Text>
            <View style={styles.subjectsHeaderRight}>
              <TouchableOpacity onPress={() => router.push('/all-subjects')}>
                <Text style={styles.subjectsEditButton}>View All</Text>
              </TouchableOpacity>
              <ArrowUpRight size={18} color="#8E8E93" style={{ marginLeft: 8 }} />
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
            {isLoadingGradedExams ? (
              <View style={styles.loadingExamsContainer}>
                <Text style={styles.loadingText}>Loading exams...</Text>
              </View>
            ) : gradedExamsError ? (
              <View style={styles.noResultsCard}>
                <Text style={styles.noResultsText}>Connection Error</Text>
                <Text style={styles.noResultsSubtext}>
                  {formatTRPCError(gradedExamsError)}
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => refetchGradedExams()}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !gradedExams || gradedExams.length === 0 ? (
              <View style={styles.noResultsCard}>
                <Text style={styles.noResultsText}>
                  No Graded Exams
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Complete some tests to see your results here
                </Text>
              </View>
            ) : (
              gradedExams.map((exam: any) => {
                const isSelected = selectedGradedExam?.id === exam.id;
                const percentile = exam.percentile || 0;
                const testType = exam.tests?.test_type || 'test';
                const testName = exam.tests?.test_name || 'Unknown Test';
                const subject = exam.tests?.subject || 'Unknown Subject';
                
                // Format test type for display
                const formatTestType = (type: string) => {
                  return type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                };
                
                return (
                  <TouchableOpacity 
                    key={exam.id}
                    style={[
                      styles.subjectCard,
                      isSelected && styles.subjectCardSelected
                    ]}
                    onPress={() => {
                      setSelectedGradedExam(isSelected ? null : exam);
                    }}
                  >
                    <Text style={[
                      styles.subjectName,
                      isSelected && styles.subjectNameSelected
                    ]}>
                      {subject}
                    </Text>
                    <Text style={[
                      styles.subjectGrade,
                      isSelected && styles.subjectGradeSelected
                    ]}>
                      {percentile}%
                    </Text>
                    <Text style={[
                      styles.subjectTestName,
                      isSelected && styles.subjectTestNameSelected
                    ]}>
                      {formatTestType(testType)}
                    </Text>
                    {isSelected && (
                      <View style={styles.subjectIndicatorSelected} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* D-Day Cards */}
        <View style={styles.dDaySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dDayScroll}
          >
            {exams?.map((exam) => {
              const examDate = new Date(exam.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              examDate.setHours(0, 0, 0, 0);
              const timeDiff = examDate.getTime() - today.getTime();
              const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
              const validDaysLeft = !isNaN(daysLeft) && isFinite(daysLeft) ? daysLeft : 0;
              
              return (
                <TouchableOpacity
                  key={exam.id}
                  onPress={() => router.push('/exam-management')}
                >
                  <DayCard 
                    title={exam.title}
                    date={exam.date}
                    daysLeft={validDaysLeft}
                    priority={exam.priority ? "high" : "medium"}
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
            {(dbPriorityTasks || priorityTasks)?.slice(0, 3).map((task, index) => {
              const taskData = dbPriorityTasks ? task : task;
              const getPriorityColor = (priority: string) => {
                switch (priority) {
                  case 'high': return '#FF3B30';
                  case 'medium': return '#FF9500';
                  case 'low': return '#34C759';
                  default: return '#8E8E93';
                }
              };
              const getPriorityLabel = (priority: string) => {
                const labels: Record<string, string> = {
                  high: '높음',
                  medium: '중간',
                  low: '낮음'
                };
                return labels[priority] || priority;
              };
              
              return (
                <TouchableOpacity 
                  key={taskData.id} 
                  style={styles.priorityTaskItem}
                  onPress={() => {
                    if (dbPriorityTasks && user?.id) {
                      updatePriorityTaskMutation.mutate({
                        id: taskData.id,
                        completed: !taskData.completed
                      });
                    } else if (togglePriorityTask) {
                      togglePriorityTask(taskData.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.priorityTaskContent}>
                    <View style={styles.priorityNumberContainer}>
                      <Text style={[styles.priorityNumber, taskData.completed && styles.priorityNumberCompleted]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.priorityTaskText}>
                      <Text style={[styles.priorityTaskTitle, taskData.completed && styles.priorityTaskTitleCompleted]}>
                        {taskData.title}
                      </Text>
                      <View style={styles.priorityTaskMeta}>
                        {taskData.subject && (
                          <Text style={[styles.priorityTaskDescription, taskData.completed && styles.priorityTaskDescriptionCompleted]}>
                            {taskData.subject}
                          </Text>
                        )}
                        <View style={[
                          styles.priorityLabel,
                          { backgroundColor: getPriorityColor(taskData.priority) + '20' }
                        ]}>
                          <Text style={[
                            styles.priorityLabelText,
                            { color: getPriorityColor(taskData.priority) }
                          ]}>
                            {getPriorityLabel(taskData.priority)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            

            
            {((!dbPriorityTasks && !priorityTasks) || (dbPriorityTasks?.length === 0 && priorityTasks?.length === 0)) && (
              <View style={styles.emptyPriorityTasks}>
                <Text style={styles.emptyPriorityText}>{isLoadingPriorityTasks ? 'Loading...' : t('emptyPriorityText')}</Text>
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
          <Text style={styles.brainDumpTitle}>{language === 'ko' ? '모든 생각 쏟아내기' : 'Brain Dump'}</Text>
          


          {isLoadingBrainDumps ? (
            <View style={styles.emptyBrainDump}>
              <Text style={styles.emptyBrainDumpText}>Loading...</Text>
            </View>
          ) : brainDumps && brainDumps.length > 0 ? (
            brainDumps.slice(0, 4).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.goalItem}
                onPress={() => {
                  updateBrainDumpMutation.mutate({
                    id: item.id,
                    is_completed: !item.is_completed
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.brainDumpPreview}>
                  <Text style={[styles.brainDumpPreviewTitle, item.is_completed && styles.brainDumpTextCompleted]}>{item.title}</Text>
                  <Text style={[styles.brainDumpPreviewContent, item.is_completed && styles.brainDumpTextCompleted]} numberOfLines={2}>
                    {item.content}
                  </Text>
                  {item.category && (
                    <Text style={[styles.brainDumpCategory, item.is_completed && { color: '#C7C7CC' }]}>{item.category}</Text>
                  )}
                </View>
                <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}>
                  {item.is_completed && <Check size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyBrainDump}>
              <Text style={styles.emptyBrainDumpText}>{brainDumpsError ? 'No data available' : 'No brain dumps yet'}</Text>
              <Text style={styles.emptyBrainDumpSubtext}>Tap to add your first thought</Text>
            </View>
          )}
          
          {brainDumps && brainDumps.length > 4 && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/brain-manager')}
            >
              <Text style={styles.seeAllText}>See All ({brainDumps.length})</Text>
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
                  onPress={() => setIsPriority(!isPriority)}
                >
                  <View style={[styles.checkbox, isPriority && styles.checkboxChecked]}>
                    {isPriority && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.priorityCheckboxLabel}>
                    {t('setPriority')}
                  </Text>
                </TouchableOpacity>
              </View>
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
      </SignedIn>
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
  debugButton: {
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
    alignItems: "flex-start",
    justifyContent: "space-between",
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
    marginLeft: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
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
  subjectsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
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
    borderColor: "#E5E5EA",
  },
  subjectCardHidden: {
    backgroundColor: "#F2F2F7",
    borderColor: "#E5E5EA",
  },
  subjectCardSelected: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9500",
    borderWidth: 3,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  subjectNameHidden: {
    color: "#8E8E93",
  },
  subjectNameSelected: {
    color: "#FF9500",
    fontWeight: "700",
  },
  subjectGrade: {
    fontSize: 12,
    color: "#333333",
  },
  subjectGradeHidden: {
    color: "#8E8E93",
  },
  subjectGradeSelected: {
    color: "#FF9500",
    fontWeight: "600",
  },
  subjectTestName: {
    fontSize: 10,
    color: "#8E8E93",
    marginTop: 2,
  },
  subjectTestNameSelected: {
    color: "#FF9500",
  },
  subjectIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#007AFF",
    marginTop: 4,
  },
  subjectIndicatorSelected: {
    backgroundColor: "#FF9500",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noResultsCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  noResultsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 2,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 10,
    color: "#C7C7CC",
    textAlign: "center",
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

  priorityTaskText: {
    flex: 1,
  },
  priorityTaskTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  priorityTaskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#8E8E93",
  },
  priorityTaskDescription: {
    fontSize: 12,
    color: "#8E8E93",
  },
  priorityTaskDescriptionCompleted: {
    textDecorationLine: "line-through",
    color: "#C7C7CC",
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
  loadingExamsContainer: {
    minWidth: 200,
    height: 80,
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
  priorityNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  priorityNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priorityNumberCompleted: {
    textDecorationLine: "line-through",
  },
  priorityTaskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priorityLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  seeAllTasksButton: {
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  seeAllTasksText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
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
  emptyBrainDumpSubtext: {
    fontSize: 12,
    color: "#C7C7CC",
    marginTop: 4,
  },
  brainDumpPreview: {
    flex: 1,
  },
  brainDumpPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  brainDumpPreviewContent: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
  },
  brainDumpCategory: {
    fontSize: 10,
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "500",
  },
  pinnedIndicator: {
    fontSize: 16,
    marginLeft: 8,
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
  expectedGradeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  expectedGradeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 2,
    textAlign: "center",
  },
  expectedGradeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  authContent: {
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  authTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  authButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  authButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  authButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  authButtonTextSecondary: {
    color: "#007AFF",
  },
});