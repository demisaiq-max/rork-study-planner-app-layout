import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Plus, X, Edit2, Trash2, FileText } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useUser } from '@/hooks/user-context';
import { trpc } from '@/lib/trpc';

interface AnswerSheet {
  id: string;
  sheet_name: string;
  subject: string;
  test_type: 'practice' | 'mock' | 'midterm' | 'final';
  created_at: string;
  total_questions: number;
  mcq_questions?: number;
  text_questions?: number;
  status: 'draft' | 'submitted' | 'graded';
  score?: number;
  grade?: string;
}

export default function MockTestsScreen() {
  const { language } = useLanguage();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    mcqQuestions?: string;
    textQuestions?: string;
    totalQuestions?: string;
    questionConfig?: string;
  }>();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetQuestions, setNewSheetQuestions] = useState('20');
  const [newMcqQuestions, setNewMcqQuestions] = useState('20');
  const [newTextQuestions, setNewTextQuestions] = useState('0');
  const [editingSheet, setEditingSheet] = useState<AnswerSheet | null>(null);
  
  // Get subject name mapping
  const getSubjectKey = (subjectName: string): 'korean' | 'mathematics' | 'english' | 'others' => {
    const name = subjectName?.toLowerCase() || '';
    if (name.includes('korean') || name.includes('국어')) return 'korean';
    if (name.includes('mathematics') || name.includes('수학')) return 'mathematics';
    if (name.includes('english') || name.includes('영어')) return 'english';
    return 'others';
  };
  
  const subjectKey = getSubjectKey(params.subjectName || '');
  
  // Fetch answer sheets from database with aggressive real-time updates
  const answerSheetsQuery = trpc.answerSheets.getAnswerSheets.useQuery(
    {
      userId: user?.id || '',
      subject: subjectKey,
      testType: 'mock',
    },
    {
      enabled: !!user?.id,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: 1000, // More frequent updates for real-time sync
      staleTime: 0, // Always consider data stale for immediate updates
    }
  );
  
  const createAnswerSheetMutation = trpc.answerSheets.createAnswerSheet.useMutation({
    onSuccess: (data) => {
      console.log('✅ Answer sheet created successfully with REAL-TIME database support:', data);
      console.log('📊 Created sheet details:', {
        id: data.id,
        total_questions: data.total_questions,
        mcq_questions: data.mcq_questions,
        text_questions: data.text_questions,
        subject: data.subject,
        status: data.status
      });
      
      // Force multiple immediate refetches to ensure real-time sync
      answerSheetsQuery.refetch();
      setTimeout(() => answerSheetsQuery.refetch(), 500);
      setTimeout(() => answerSheetsQuery.refetch(), 1000);
      
      setShowAddModal(false);
      setNewSheetName('');
      setNewSheetQuestions('20');
      setNewMcqQuestions('20');
      setNewTextQuestions('0');
      Alert.alert('Success', `Answer sheet created successfully with ${data.total_questions} questions (${data.mcq_questions} MCQ, ${data.text_questions} Text)! Real-time updates enabled.`);
    },
    onError: (error) => {
      console.error('❌ Failed to create answer sheet:', error);
      Alert.alert('Error', error.message || 'Failed to create answer sheet');
    },
  });
  
  const updateAnswerSheetMutation = trpc.answerSheets.updateAnswerSheet.useMutation({
    onSuccess: (data) => {
      console.log('✅ Answer sheet updated successfully with REAL-TIME support:', data);
      
      // Force multiple immediate refetches to ensure real-time sync
      answerSheetsQuery.refetch();
      setTimeout(() => answerSheetsQuery.refetch(), 500);
      setTimeout(() => answerSheetsQuery.refetch(), 1000);
      
      setEditingSheet(null);
      setShowAddModal(false);
      setNewSheetName('');
      setNewSheetQuestions('20');
      setNewMcqQuestions('20');
      setNewTextQuestions('0');
      Alert.alert('Success', 'Answer sheet updated successfully! Changes are now live in real-time database.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update answer sheet');
    },
  });
  
  const deleteAnswerSheetMutation = trpc.answerSheets.deleteAnswerSheet.useMutation({
    onSuccess: () => {
      console.log('✅ Answer sheet deleted successfully with REAL-TIME sync');
      
      // Force multiple immediate refetches to ensure real-time sync
      answerSheetsQuery.refetch();
      setTimeout(() => answerSheetsQuery.refetch(), 500);
      
      Alert.alert('Success', 'Answer sheet deleted successfully! Changes synced in real-time.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to delete answer sheet');
    },
  });
  
  const answerSheets = answerSheetsQuery.data || [];
  const isLoading = answerSheetsQuery.isLoading;
  
  console.log('Answer sheets data:', answerSheets);
  console.log('Subject key:', subjectKey);
  console.log('User ID:', user?.id);

  const handleAddSheet = () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to create answer sheets');
      return;
    }
    
    if (!newSheetName.trim()) {
      Alert.alert('Error', 'Please enter a sheet name');
      return;
    }
    
    const questionsNum = parseInt(newSheetQuestions) || 20;
    if (questionsNum < 1 || questionsNum > 200) {
      Alert.alert('Error', 'Questions must be between 1 and 200');
      return;
    }

    // Use the manually entered values from the form
    const mcqQuestions = parseInt(newMcqQuestions) || 0;
    const textQuestions = parseInt(newTextQuestions) || 0;
    
    // Validate that MCQ + Text = Total
    if (mcqQuestions + textQuestions !== questionsNum) {
      Alert.alert('Error', `MCQ questions (${mcqQuestions}) + Text questions (${textQuestions}) must equal total questions (${questionsNum})`);
      return;
    }

    console.log('Creating answer sheet with:', {
      userId: user.id,
      subject: subjectKey,
      sheetName: newSheetName,
      testType: 'mock',
      totalQuestions: questionsNum,
      mcqQuestions,
      textQuestions
    });

    createAnswerSheetMutation.mutate({
      userId: user.id,
      subject: subjectKey,
      sheetName: newSheetName,
      testType: 'mock',
      totalQuestions: questionsNum,
      mcqQuestions,
      textQuestions,
    });
  };

  const handleEditSheet = (sheet: AnswerSheet) => {
    setEditingSheet(sheet);
    setNewSheetName(sheet.sheet_name);
    setNewSheetQuestions(sheet.total_questions.toString());
    setNewMcqQuestions((sheet.mcq_questions || sheet.total_questions).toString());
    setNewTextQuestions((sheet.text_questions || 0).toString());
    setShowAddModal(true);
  };

  const handleUpdateSheet = () => {
    if (!editingSheet || !newSheetName.trim()) {
      Alert.alert('Error', 'Please enter a sheet name');
      return;
    }
    
    const questionsNum = parseInt(newSheetQuestions) || 20;
    const mcqQuestions = parseInt(newMcqQuestions) || 0;
    const textQuestions = parseInt(newTextQuestions) || 0;
    
    if (questionsNum < 1 || questionsNum > 200) {
      Alert.alert('Error', 'Questions must be between 1 and 200');
      return;
    }
    
    if (mcqQuestions + textQuestions !== questionsNum) {
      Alert.alert('Error', 'MCQ + Text questions must equal total questions');
      return;
    }

    console.log('Updating answer sheet with:', {
      sheetId: editingSheet.id,
      sheetName: newSheetName,
      totalQuestions: questionsNum,
      mcqQuestions,
      textQuestions,
      subjectKey
    });

    updateAnswerSheetMutation.mutate({
      sheetId: editingSheet.id,
      sheetName: newSheetName,
      totalQuestions: questionsNum,
      mcqQuestions,
      textQuestions,
    });
  };

  const handleDeleteSheet = (sheetId: string) => {
    Alert.alert(
      'Delete Answer Sheet',
      'Are you sure you want to delete this answer sheet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAnswerSheetMutation.mutate({ sheetId });
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingSheet(null);
    setNewSheetName('');
    setNewSheetQuestions('20');
    setNewMcqQuestions('20');
    setNewTextQuestions('0');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: language === 'ko' ? 'Mock Tests' : 'Mock Tests',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.subjectIndicator, { backgroundColor: params.subjectColor || '#4ECDC4' }]} />
          <View>
            <Text style={styles.headerTitle}>{params.subjectName || 'Mock Tests'}</Text>

          </View>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: params.subjectColor || '#4ECDC4' }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {language === 'ko' ? '로딩 중...' : 'Loading...'}
            </Text>
          </View>
        ) : answerSheets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>
              {language === 'ko' ? '모의고사가 없습니다' : 'No Mock Tests'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'ko' ? '새 모의고사를 만들어보세요' : 'Create your first mock test'}
            </Text>
          </View>
        ) : (
          <View style={styles.sheetsList}>
            {answerSheets.map((sheet) => (
              <View key={sheet.id} style={styles.sheetCard}>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetInfo}>
                    <Text style={styles.sheetName}>{sheet.sheet_name}</Text>
                    <Text style={styles.sheetMeta}>
                      {sheet.total_questions} questions ({sheet.mcq_questions || 0} MCQ, {sheet.text_questions || 0} Text)
                    </Text>
                    <Text style={styles.sheetDate}>
                      {new Date(sheet.created_at).toLocaleDateString()}
                      {sheet.status === 'graded' && sheet.score && (
                        <Text style={styles.scoreText}> • Score: {sheet.score}{sheet.grade && ` (${sheet.grade})`}</Text>
                      )}
                    </Text>
                  </View>
                  <View style={styles.sheetActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditSheet(sheet)}
                      disabled={sheet.status === 'submitted' || sheet.status === 'graded'}
                    >
                      <Edit2 size={16} color={sheet.status === 'draft' ? '#8E8E93' : '#C7C7CC'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteSheet(sheet.id)}
                    >
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.statusIndicator}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: 
                        sheet.status === 'draft' ? '#FF9500' :
                        sheet.status === 'submitted' ? '#007AFF' :
                        '#34C759'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {sheet.status === 'draft' ? (language === 'ko' ? '작성중' : 'Draft') :
                       sheet.status === 'submitted' ? (language === 'ko' ? '제출됨' : 'Submitted') :
                       (language === 'ko' ? '채점됨' : 'Graded')}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.openSheetButton, { backgroundColor: (params.subjectColor || '#4ECDC4') + '20' }]}
                  onPress={() => {
                    // Navigate to subject-specific answer sheet based on subject name
                    const subjectName = params.subjectName?.toLowerCase() || '';
                    let pathname = '/answer-sheet-editor'; // Default fallback
                    
                    if (subjectName.includes('korean') || subjectName.includes('국어')) {
                      pathname = '/korean-answer-sheet';
                    } else if (subjectName.includes('mathematics') || subjectName.includes('수학')) {
                      pathname = '/mathematics-answer-sheet';
                    } else if (subjectName.includes('english') || subjectName.includes('영어')) {
                      pathname = '/english-answer-sheet';
                    } else if (subjectName.includes('others') || subjectName.includes('그외')) {
                      pathname = '/others-answer-sheet';
                    }
                    
                    router.push({
                      pathname,
                      params: {
                        sheetId: sheet.id,
                        name: sheet.sheet_name,
                        subjectId: params.subjectId,
                        subjectName: params.subjectName,
                        subjectColor: params.subjectColor,
                        mcqQuestions: (sheet.mcq_questions || sheet.total_questions).toString(),
                        textQuestions: (sheet.text_questions || 0).toString(),
                        totalQuestions: sheet.total_questions.toString(),
                        questionConfig: params.questionConfig,
                      }
                    });
                  }}
                >
                  <Text style={[styles.openSheetText, { color: params.subjectColor || '#4ECDC4' }]}>
                    {language === 'ko' ? '답안지 열기' : 'Open Answer Sheet'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSheet 
                ? (language === 'ko' ? '모의고사 수정' : 'Edit Mock Test')
                : (language === 'ko' ? '새 모의고사' : 'New Mock Test')
              }
            </Text>
            <TouchableOpacity 
              onPress={editingSheet ? handleUpdateSheet : handleAddSheet}
              disabled={createAnswerSheetMutation.isPending || updateAnswerSheetMutation.isPending}
            >
              <Text style={[styles.saveButton, {
                opacity: (createAnswerSheetMutation.isPending || updateAnswerSheetMutation.isPending) ? 0.5 : 1
              }]}>
                {(createAnswerSheetMutation.isPending || updateAnswerSheetMutation.isPending) 
                  ? (language === 'ko' ? '저장 중...' : 'Saving...') 
                  : (language === 'ko' ? '저장' : 'Save')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '모의고사 이름' : 'Mock Test Name'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newSheetName}
                onChangeText={setNewSheetName}
                placeholder={language === 'ko' ? '모의고사 이름을 입력하세요' : 'Enter mock test name'}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '총 문제 수' : 'Total Questions'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newSheetQuestions}
onChangeText={(text) => {
                  setNewSheetQuestions(text);
                  // Only auto-calculate if creating a new sheet (not editing)
                  if (!editingSheet) {
                    const questionsNum = parseInt(text) || 20;
                    let mcqQuestions = questionsNum;
                    let textQuestions = 0;
                    
                    if (subjectKey === 'korean') {
                      if (questionsNum === 45) {
                        mcqQuestions = 34;
                        textQuestions = 11;
                      } else {
                        mcqQuestions = Math.floor(questionsNum * 0.75);
                        textQuestions = questionsNum - mcqQuestions;
                      }
                    } else if (subjectKey === 'mathematics') {
                      mcqQuestions = questionsNum;
                      textQuestions = 0;
                    } else if (subjectKey === 'english') {
                      mcqQuestions = questionsNum;
                      textQuestions = 0;
                    } else if (subjectKey === 'others') {
                      mcqQuestions = questionsNum;
                      textQuestions = 0;
                    }
                    
                    setNewMcqQuestions(mcqQuestions.toString());
                    setNewTextQuestions(textQuestions.toString());
                  }
                }}
                placeholder="20"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? 'MCQ 문제 수' : 'MCQ Questions'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newMcqQuestions}
                onChangeText={(text) => {
                  setNewMcqQuestions(text);
                  const mcq = parseInt(text) || 0;
                  const textQ = parseInt(newTextQuestions) || 0;
                  setNewSheetQuestions((mcq + textQ).toString());
                }}
                placeholder="20"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '주관식 문제 수' : 'Text Questions'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newTextQuestions}
                onChangeText={(text) => {
                  setNewTextQuestions(text);
                  const textQ = parseInt(text) || 0;
                  const mcq = parseInt(newMcqQuestions) || 0;
                  setNewSheetQuestions((mcq + textQ).toString());
                }}
                placeholder="0"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  sheetsList: {
    gap: 16,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sheetInfo: {
    flex: 1,
    marginRight: 12,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sheetMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  sheetDate: {
    fontSize: 11,
    color: '#C7C7CC',
  },
  scoreText: {
    color: '#34C759',
    fontWeight: '600',
  },
  statusIndicator: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openSheetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  openSheetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});