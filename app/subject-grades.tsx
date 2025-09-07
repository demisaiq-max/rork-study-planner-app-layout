import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Trash2, Edit3 } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';

const { width } = Dimensions.get('window');

type ExamType = 'mock' | 'midterm' | 'final';
type SubjectGrade = {
  id?: string;
  subject: string;
  grades: {
    mock?: number;
    midterm?: number;
    final?: number;
  };
};

export default function SubjectGradesScreen() {
  const { user } = useUser();
  const { t, language } = useLanguage();
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('mock');
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch grades from backend
  const gradesQuery = trpc.grades.getSubjectGrades.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const updateGradeMutation = trpc.grades.updateSubjectGrade.useMutation({
    onSuccess: () => {
      gradesQuery.refetch();
    },
  });

  const deleteGradeMutation = trpc.grades.deleteSubjectGrade.useMutation({
    onSuccess: () => {
      gradesQuery.refetch();
    },
  });

  // Process grades data
  useEffect(() => {
    if (gradesQuery.data) {
      const processedGrades: SubjectGrade[] = gradesQuery.data.map((grade: any) => {
        let grades = {};
        try {
          grades = grade.grades ? JSON.parse(grade.grades) : {};
        } catch (e) {
          console.error('Failed to parse grades:', e);
        }
        return {
          id: grade.id,
          subject: grade.subject,
          grades: grades,
        };
      });
      setSubjectGrades(processedGrades);
      setIsLoading(false);
    }
  }, [gradesQuery.data]);

  // Calculate statistics
  const stats = useMemo(() => {
    const allGrades = subjectGrades.flatMap(sg => {
      const grades = [];
      if (sg.grades.mock) grades.push(sg.grades.mock);
      if (sg.grades.midterm) grades.push(sg.grades.midterm);
      if (sg.grades.final) grades.push(sg.grades.final);
      return grades;
    });

    const currentExamGrades = subjectGrades
      .map(sg => sg.grades[selectedExamType])
      .filter(g => g !== undefined && g !== null) as number[];

    if (currentExamGrades.length === 0) {
      return {
        targetPercentile: 89,
        averagePercentile: 50,
        recentPercentile: 0,
      };
    }

    // Calculate percentiles (lower grade number = better = higher percentile)
    const avgGrade = currentExamGrades.reduce((sum, g) => sum + g, 0) / currentExamGrades.length;
    const recentPercentile = Math.round(Math.max(10, Math.min(99, (10 - avgGrade) * 11 + 50)));
    
    const allAvgGrade = allGrades.length > 0 
      ? allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length 
      : 5;
    const averagePercentile = Math.round(Math.max(10, Math.min(99, (10 - allAvgGrade) * 11 + 50)));

    return {
      targetPercentile: 89,
      averagePercentile,
      recentPercentile,
    };
  }, [subjectGrades, selectedExamType]);

  const updateGrade = async (subject: string, grade: number | null) => {
    if (!user?.id) return;

    try {
      await updateGradeMutation.mutateAsync({
        userId: user.id,
        subject,
        examType: selectedExamType,
        grade,
      });
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateGrade'));
    }
  };

  const deleteSubject = (subject: string) => {
    Alert.alert(
      t('deleteGrade'),
      t('deleteGradeConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await deleteGradeMutation.mutateAsync({
                userId: user.id,
                subject,
              });
            } catch (error) {
              Alert.alert(t('error'), t('failedToDeleteGrade'));
            }
          },
        },
      ]
    );
  };

  const addNewSubject = async () => {
    if (!newSubjectName.trim() || !user?.id) {
      Alert.alert(t('error'), t('enterSubjectName'));
      return;
    }

    // Check if subject already exists
    if (subjectGrades.some(sg => sg.subject === newSubjectName.trim())) {
      Alert.alert(t('error'), t('subjectAlreadyExists'));
      return;
    }

    try {
      await updateGradeMutation.mutateAsync({
        userId: user.id,
        subject: newSubjectName.trim(),
        examType: 'mock',
        grade: null,
      });
      setNewSubjectName('');
      setIsAddModalVisible(false);
    } catch (error) {
      Alert.alert(t('error'), t('failedToAddSubject'));
    }
  };

  const getCurrentGrade = (subjectGrade: SubjectGrade): number | undefined => {
    return subjectGrade.grades[selectedExamType];
  };

  const getGradeTrend = (subjectGrade: SubjectGrade): 'up' | 'down' | 'same' => {
    const mock = subjectGrade.grades.mock;
    const midterm = subjectGrade.grades.midterm;
    const final = subjectGrade.grades.final;
    
    if (selectedExamType === 'midterm' && mock && midterm) {
      if (midterm < mock) return 'up';
      if (midterm > mock) return 'down';
    }
    
    if (selectedExamType === 'final' && midterm && final) {
      if (final < midterm) return 'up';
      if (final > midterm) return 'down';
    }
    
    return 'same';
  };

  // Translate subject names
  const getSubjectName = (subject: string): string => {
    const subjectMap: { [key: string]: string } = {
      '국어': t('korean'),
      '영어': t('english'),
      '수학': t('math'),
      '탐구': t('science'),
      '예체능': t('arts'),
    };
    return subjectMap[subject] || subject;
  };

  const examTypes = [
    { key: 'mock' as ExamType, label: t('mockTest'), color: '#007AFF' },
    { key: 'midterm' as ExamType, label: t('midterm'), color: '#34C759' },
    { key: 'final' as ExamType, label: t('finalExam'), color: '#FF9500' },
  ];

  const selectedExamInfo = examTypes.find(et => et.key === selectedExamType)!;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('subjectGrades')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subjectGrades')}</Text>
        <TouchableOpacity 
          onPress={() => setIsAddModalVisible(true)} 
          style={styles.addButton}
        >
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.targetPercentile}</Text>
            <Text style={styles.statLabel}>{t('targetPercentile')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averagePercentile}</Text>
            <Text style={styles.statLabel}>{t('averagePercentile')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.recentPercentile || '-'}</Text>
            <Text style={styles.statLabel}>{t('recentPercentile')}</Text>
          </View>
        </View>

        {/* Exam Type Selector */}
        <View style={styles.examTypeContainer}>
          <Text style={styles.sectionTitle}>{t('examTypeLabel')}</Text>
          <View style={styles.examTypeButtons}>
            {examTypes.map((examType) => (
              <TouchableOpacity
                key={examType.key}
                style={[
                  styles.examTypeButton,
                  selectedExamType === examType.key && {
                    backgroundColor: examType.color,
                  },
                ]}
                onPress={() => setSelectedExamType(examType.key)}
              >
                <Text
                  style={[
                    styles.examTypeButtonText,
                    selectedExamType === examType.key && styles.examTypeButtonTextSelected,
                  ]}
                >
                  {examType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject Grades */}
        <View style={styles.gradesContainer}>
          <Text style={styles.sectionTitle}>
            {selectedExamType === 'mock' && t('mockTestGrades')}
            {selectedExamType === 'midterm' && t('midtermGrades')}
            {selectedExamType === 'final' && t('finalGrades')}
          </Text>
          
          {subjectGrades.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noSubjectsAdded')}</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => setIsAddModalVisible(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>{t('addSubject')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            subjectGrades.map((subjectGrade) => {
              const currentGrade = getCurrentGrade(subjectGrade);
              const trend = getGradeTrend(subjectGrade);
              const isEditing = editingSubject === subjectGrade.subject;
              
              return (
                <View key={subjectGrade.subject} style={styles.subjectGradeCard}>
                  <View style={styles.subjectHeader}>
                    <Text style={styles.subjectName}>
                      {language === 'en' ? getSubjectName(subjectGrade.subject) : subjectGrade.subject}
                    </Text>
                    <View style={styles.gradeInfo}>
                      <Text style={styles.currentGrade}>
                        {currentGrade ? `${t(`grade${currentGrade}`)}` : t('noGrade')}
                      </Text>
                      {trend !== 'same' && currentGrade && (
                        <View style={styles.trendIcon}>
                          {trend === 'up' ? (
                            <TrendingUp size={16} color="#34C759" />
                          ) : (
                            <TrendingDown size={16} color="#FF3B30" />
                          )}
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => setEditingSubject(isEditing ? null : subjectGrade.subject)}
                        style={styles.editButton}
                      >
                        <Edit3 size={16} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {isEditing && (
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          setEditingSubject(null);
                          deleteSubject(subjectGrade.subject);
                        }}
                      >
                        <Trash2 size={18} color="#FF3B30" />
                        <Text style={styles.deleteButtonText}>{t('deleteGrade')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.gradeSelector}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.gradeOption,
                          currentGrade === grade && {
                            backgroundColor: selectedExamInfo.color,
                            borderColor: selectedExamInfo.color,
                          },
                        ]}
                        onPress={() => updateGrade(subjectGrade.subject, grade)}
                      >
                        <Text
                          style={[
                            styles.gradeOptionText,
                            currentGrade === grade && styles.gradeOptionTextSelected,
                          ]}
                        >
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.gradeOption}
                      onPress={() => updateGrade(subjectGrade.subject, null)}
                    >
                      <Text style={styles.gradeOptionText}>X</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Grade History */}
                  <View style={styles.gradeHistory}>
                    <Text style={styles.historyLabel}>{t('gradeHistory')}:</Text>
                    <View style={styles.historyGrades}>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyType}>{t('mockShort')}</Text>
                        <Text style={styles.historyGrade}>
                          {subjectGrade.grades.mock ? `${subjectGrade.grades.mock}` : '-'}
                        </Text>
                      </View>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyType}>{t('midtermShort')}</Text>
                        <Text style={styles.historyGrade}>
                          {subjectGrade.grades.midterm ? `${subjectGrade.grades.midterm}` : '-'}
                        </Text>
                      </View>
                      <View style={styles.historyItem}>
                        <Text style={styles.historyType}>{t('finalShort')}</Text>
                        <Text style={styles.historyGrade}>
                          {subjectGrade.grades.final ? `${subjectGrade.grades.final}` : '-'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addSubject')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterSubjectName')}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewSubjectName('');
                  setIsAddModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addNewSubject}
              >
                <Text style={styles.saveButtonText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  examTypeContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  examTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  examTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  examTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  examTypeButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradesContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subjectGradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  gradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentGrade: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  trendIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
  },
  editActions: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF2F2',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  gradeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gradeOption: {
    width: (width - 40 - 32 - 80) / 10,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gradeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  gradeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradeHistory: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  historyLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  historyGrades: {
    flexDirection: 'row',
    gap: 24,
  },
  historyItem: {
    alignItems: 'center',
  },
  historyType: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  historyGrade: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});