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
import { ArrowLeft, Plus, Trash2, Edit3 } from 'lucide-react-native';
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

type SelectedTest = {
  subject: string;
  examType: ExamType;
  grade: number;
};

export default function SubjectGradesScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<SelectedTest | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ subject: string; examType: ExamType; currentGrade?: number } | null>(null);
  const [newGradeValue, setNewGradeValue] = useState('');

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

  const seedDummyDataMutation = trpc.grades.seedDummyData.useMutation({
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

  // Calculate statistics based on selected test or all grades
  const statistics = useMemo(() => {
    if (selectedTest) {
      // Convert grade to percentile (1등급 = 99%, 2등급 = 96%, etc.)
      const gradeToPercentile: { [key: number]: number } = {
        1: 99, 2: 96, 3: 89, 4: 77, 5: 60, 6: 40, 7: 23, 8: 11, 9: 4
      };
      const percentile = gradeToPercentile[selectedTest.grade] || 0;
      return {
        target: 89, // Keep target fixed
        average: percentile,
        recent: percentile
      };
    }
    
    // Calculate overall statistics from all grades
    const allGrades: number[] = [];
    subjectGrades.forEach(sg => {
      if (sg.grades.mock) allGrades.push(sg.grades.mock);
      if (sg.grades.midterm) allGrades.push(sg.grades.midterm);
      if (sg.grades.final) allGrades.push(sg.grades.final);
    });
    
    if (allGrades.length === 0) {
      return { target: 89, average: 50, recent: 68 };
    }
    
    const gradeToPercentile: { [key: number]: number } = {
      1: 99, 2: 96, 3: 89, 4: 77, 5: 60, 6: 40, 7: 23, 8: 11, 9: 4
    };
    
    const percentiles = allGrades.map(g => gradeToPercentile[g] || 0);
    const average = Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length);
    const recent = percentiles[percentiles.length - 1] || average;
    
    return { target: 89, average, recent };
  }, [selectedTest, subjectGrades]);

  const seedDummyData = async () => {
    if (!user?.id) return;
    try {
      await seedDummyDataMutation.mutateAsync({ userId: user.id });
    } catch (error) {
      Alert.alert(t('error'), t('failedToSeedData'));
    }
  };

  const updateGrade = async (subject: string, examType: ExamType, grade: number | null) => {
    if (!user?.id) return;

    try {
      await updateGradeMutation.mutateAsync({
        userId: user.id,
        subject,
        examType,
        grade,
      });
      setEditModalVisible(false);
      setEditingGrade(null);
      setNewGradeValue('');
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

  const handleTestClick = (subject: string, examType: ExamType, grade?: number) => {
    if (grade) {
      setSelectedTest({ subject, examType, grade });
    } else {
      // Open edit modal to add grade
      setEditingGrade({ subject, examType });
      setEditModalVisible(true);
    }
  };

  const handleEditGrade = (subject: string, examType: ExamType, currentGrade?: number) => {
    setEditingGrade({ subject, examType, currentGrade });
    setNewGradeValue(currentGrade ? currentGrade.toString() : '');
    setEditModalVisible(true);
  };

  const saveGrade = () => {
    if (!editingGrade) return;
    
    const grade = newGradeValue ? parseInt(newGradeValue) : null;
    if (grade && (grade < 1 || grade > 9)) {
      Alert.alert(t('error'), t('gradeRange'));
      return;
    }
    
    updateGrade(editingGrade.subject, editingGrade.examType, grade);
  };

  // Translate subject names
  const getSubjectName = (subject: string): string => {
    // Map Korean subject names to translation keys
    const koreanToKey: { [key: string]: string } = {
      '국어': 'korean',
      '영어': 'english', 
      '수학': 'math',
      '탐구': 'science',
      '예체능': 'arts',
    };
    
    // Map English subject names to translation keys
    const englishToKey: { [key: string]: string } = {
      'Korean': 'korean',
      'English': 'english',
      'Math': 'math',
      'Science': 'science',
      'Arts & PE': 'arts',
    };
    
    // Check if it's a known Korean or English subject name
    const key = koreanToKey[subject] || englishToKey[subject];
    if (key) {
      return t(key);
    }
    
    // Return original if not found in mappings
    return subject;
  };

  const getExamTypeLabel = (examType: ExamType): string => {
    switch (examType) {
      case 'mock': return t('mockTest');
      case 'midterm': return t('midterm');
      case 'final': return t('finalExam');
      default: return '';
    }
  };

  const getExamTypeShortLabel = (examType: ExamType): string => {
    switch (examType) {
      case 'mock': return t('mockShort');
      case 'midterm': return t('midtermShort');
      case 'final': return t('finalShort');
      default: return '';
    }
  };

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
        {selectedTest && (
          <View style={styles.selectedTestInfo}>
            <Text style={styles.selectedTestText}>
              {getSubjectName(selectedTest.subject)} - {getExamTypeLabel(selectedTest.examType)}
            </Text>
            <TouchableOpacity onPress={() => setSelectedTest(null)}>
              <Text style={styles.clearSelection}>{t('clearSelection')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Subject Grades */}
        <View style={styles.gradesContainer}>
          <Text style={styles.sectionTitle}>{t('subjects')}</Text>
          
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
              <TouchableOpacity 
                style={[styles.addFirstButton, styles.seedButton]}
                onPress={seedDummyData}
                disabled={seedDummyDataMutation.isPending}
              >
                <Text style={styles.addFirstButtonText}>
                  {seedDummyDataMutation.isPending ? t('loading') : 'Load Sample Data'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            subjectGrades.map((subjectGrade) => {
              const isEditing = editingSubject === subjectGrade.subject;
              
              return (
                <View key={subjectGrade.subject} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <Text style={styles.subjectName}>
                      {getSubjectName(subjectGrade.subject)}
                    </Text>
                    <View style={styles.subjectActions}>
                      <TouchableOpacity
                        onPress={() => setEditingSubject(isEditing ? null : subjectGrade.subject)}
                        style={styles.editButton}
                      >
                        <Edit3 size={18} color="#8E8E93" />
                      </TouchableOpacity>
                      {isEditing && (
                        <TouchableOpacity
                          onPress={() => {
                            setEditingSubject(null);
                            deleteSubject(subjectGrade.subject);
                          }}
                          style={styles.deleteIconButton}
                        >
                          <Trash2 size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.testButtonsContainer}>
                    {(['mock', 'midterm', 'final'] as ExamType[]).map((examType) => {
                      const grade = subjectGrade.grades[examType];
                      const isSelected = selectedTest?.subject === subjectGrade.subject && 
                                       selectedTest?.examType === examType;
                      
                      return (
                        <TouchableOpacity
                          key={examType}
                          style={[
                            styles.testButton,
                            isSelected && styles.testButtonSelected,
                            !grade && styles.testButtonEmpty
                          ]}
                          onPress={() => handleTestClick(subjectGrade.subject, examType, grade)}
                          onLongPress={() => handleEditGrade(subjectGrade.subject, examType, grade)}
                        >
                          <Text style={[
                            styles.testTypeLabel,
                            isSelected && styles.testTypeLabelSelected
                          ]}>
                            {getExamTypeShortLabel(examType)}
                          </Text>
                          <Text style={[
                            styles.testGrade,
                            isSelected && styles.testGradeSelected,
                            !grade && styles.testGradeEmpty
                          ]}>
                            {grade ? `${grade}${t('gradeUnit')}` : '+'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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

      {/* Edit Grade Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGrade && `${getSubjectName(editingGrade.subject)} - ${getExamTypeLabel(editingGrade.examType)}`}
            </Text>
            <Text style={styles.modalSubtitle}>{t('enterGrade')}</Text>
            <TextInput
              style={styles.input}
              placeholder="1-9"
              value={newGradeValue}
              onChangeText={setNewGradeValue}
              keyboardType="numeric"
              maxLength={1}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingGrade(null);
                  setNewGradeValue('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveGrade}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
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

  selectedTestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E8F4FF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  selectedTestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  clearSelection: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  seedButton: {
    backgroundColor: '#34C759',
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  subjectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  deleteIconButton: {
    padding: 4,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8E8E93',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  testButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  testButtonEmpty: {
    borderStyle: 'dashed',
    borderColor: '#C7C7CC',
  },
  testTypeLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  testTypeLabelSelected: {
    color: '#FFFFFF',
  },
  testGrade: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  testGradeSelected: {
    color: '#FFFFFF',
  },
  testGradeEmpty: {
    color: '#C7C7CC',
    fontSize: 20,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
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