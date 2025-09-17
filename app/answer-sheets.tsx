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
  SafeAreaView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Plus, X, Edit2, Trash2, FileText } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';

type Subject = 'korean' | 'mathematics' | 'english' | 'others';

interface AnswerSheet {
  id: string;
  name: string;
  subject: Subject;
  createdAt: Date;
  questions: number;
}

const SUBJECTS: { key: Subject; label: string; color: string }[] = [
  { key: 'korean', label: 'Korean (국어)', color: '#FF6B6B' },
  { key: 'mathematics', label: 'Mathematics (수학)', color: '#4ECDC4' },
  { key: 'english', label: 'English (영어)', color: '#45B7D1' },
  { key: 'others', label: 'Others (그외)', color: '#96CEB4' },
];

export default function AnswerSheetsScreen() {
  const { t, language } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('korean');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetQuestions, setNewSheetQuestions] = useState('20');
  const [editingSheet, setEditingSheet] = useState<AnswerSheet | null>(null);
  
  // Mock data - in real app this would come from backend
  const [answerSheets, setAnswerSheets] = useState<AnswerSheet[]>([
    {
      id: '1',
      name: '2024 수능 모의고사 1회',
      subject: 'korean',
      createdAt: new Date('2024-01-15'),
      questions: 45,
    },
    {
      id: '2', 
      name: '중간고사 대비 문제',
      subject: 'korean',
      createdAt: new Date('2024-01-10'),
      questions: 30,
    },
    {
      id: '3',
      name: '미적분 단원평가',
      subject: 'mathematics',
      createdAt: new Date('2024-01-12'),
      questions: 25,
    },
    {
      id: '4',
      name: 'TOEIC Practice Test',
      subject: 'english',
      createdAt: new Date('2024-01-08'),
      questions: 100,
    },
    {
      id: '5',
      name: '한국사 능력검정시험',
      subject: 'others',
      createdAt: new Date('2024-01-05'),
      questions: 50,
    },
  ]);

  const filteredSheets = answerSheets.filter(sheet => sheet.subject === selectedSubject);
  const selectedSubjectInfo = SUBJECTS.find(s => s.key === selectedSubject)!;

  const handleAddSheet = () => {
    if (!newSheetName.trim()) {
      Alert.alert('Error', 'Please enter a sheet name');
      return;
    }
    
    const questionsNum = parseInt(newSheetQuestions) || 20;
    if (questionsNum < 1 || questionsNum > 200) {
      Alert.alert('Error', 'Questions must be between 1 and 200');
      return;
    }

    const newSheet: AnswerSheet = {
      id: Date.now().toString(),
      name: newSheetName,
      subject: selectedSubject,
      createdAt: new Date(),
      questions: questionsNum,
    };

    setAnswerSheets(prev => [newSheet, ...prev]);
    setNewSheetName('');
    setNewSheetQuestions('20');
    setShowAddModal(false);
  };

  const handleEditSheet = (sheet: AnswerSheet) => {
    setEditingSheet(sheet);
    setNewSheetName(sheet.name);
    setNewSheetQuestions(sheet.questions.toString());
    setShowAddModal(true);
  };

  const handleUpdateSheet = () => {
    if (!editingSheet || !newSheetName.trim()) {
      Alert.alert('Error', 'Please enter a sheet name');
      return;
    }
    
    const questionsNum = parseInt(newSheetQuestions) || 20;
    if (questionsNum < 1 || questionsNum > 200) {
      Alert.alert('Error', 'Questions must be between 1 and 200');
      return;
    }

    setAnswerSheets(prev => prev.map(sheet => 
      sheet.id === editingSheet.id 
        ? { ...sheet, name: newSheetName, questions: questionsNum }
        : sheet
    ));
    
    setEditingSheet(null);
    setNewSheetName('');
    setNewSheetQuestions('20');
    setShowAddModal(false);
  };

  const handleDeleteSheet = (sheetId: string) => {
    Alert.alert(
      'Delete Answer Sheet',
      'Are you sure you want to delete this answer sheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAnswerSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: language === 'ko' ? '답안지 관리' : 'Answer Sheets',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      
      {/* Subject Tabs */}
      <View style={styles.subjectTabs}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject.key}
              style={[
                styles.subjectTab,
                selectedSubject === subject.key && {
                  backgroundColor: subject.color,
                  ...styles.subjectTabActive
                }
              ]}
              onPress={() => setSelectedSubject(subject.key)}
            >
              <Text style={[
                styles.subjectTabText,
                selectedSubject === subject.key && styles.subjectTabTextActive
              ]}>
                {subject.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Answer Sheets List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.subjectIndicator, { backgroundColor: selectedSubjectInfo.color }]} />
            <Text style={styles.headerTitle}>{selectedSubjectInfo.label}</Text>
            <Text style={styles.sheetCount}>({filteredSheets.length})</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: selectedSubjectInfo.color }]}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {filteredSheets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>
              {language === 'ko' ? '답안지가 없습니다' : 'No Answer Sheets'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'ko' ? '새 답안지를 만들어보세요' : 'Create your first answer sheet'}
            </Text>
          </View>
        ) : (
          <View style={styles.sheetsList}>
            {filteredSheets.map((sheet) => (
              <View key={sheet.id} style={styles.sheetCard}>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetInfo}>
                    <Text style={styles.sheetName}>{sheet.name}</Text>
                    <Text style={styles.sheetMeta}>
                      {sheet.questions} questions • {sheet.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.sheetActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditSheet(sheet)}
                    >
                      <Edit2 size={16} color="#8E8E93" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteSheet(sheet.id)}
                    >
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.openSheetButton, { backgroundColor: selectedSubjectInfo.color + '20' }]}
                  onPress={() => {
                    router.push({
                      pathname: '/answer-sheet-editor',
                      params: {
                        subject: sheet.subject,
                        name: sheet.name,
                        questions: sheet.questions.toString()
                      }
                    });
                  }}
                >
                  <Text style={[styles.openSheetText, { color: selectedSubjectInfo.color }]}>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSheet 
                ? (language === 'ko' ? '답안지 수정' : 'Edit Answer Sheet')
                : (language === 'ko' ? '새 답안지' : 'New Answer Sheet')
              }
            </Text>
            <TouchableOpacity onPress={editingSheet ? handleUpdateSheet : handleAddSheet}>
              <Text style={styles.saveButton}>
                {language === 'ko' ? '저장' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '답안지 이름' : 'Sheet Name'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newSheetName}
                onChangeText={setNewSheetName}
                placeholder={language === 'ko' ? '답안지 이름을 입력하세요' : 'Enter sheet name'}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '문제 수' : 'Number of Questions'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newSheetQuestions}
                onChangeText={setNewSheetQuestions}
                placeholder="20"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '과목' : 'Subject'}
              </Text>
              <View style={styles.subjectSelector}>
                {SUBJECTS.map((subject) => (
                  <TouchableOpacity
                    key={subject.key}
                    style={[
                      styles.subjectOption,
                      selectedSubject === subject.key && {
                        backgroundColor: subject.color,
                        ...styles.subjectOptionSelected
                      }
                    ]}
                    onPress={() => setSelectedSubject(subject.key)}
                  >
                    <Text style={[
                      styles.subjectOptionText,
                      selectedSubject === subject.key && styles.subjectOptionTextSelected
                    ]}>
                      {subject.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    backgroundColor: '#F2F2F7',
  },
  subjectTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  subjectTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    minWidth: 120,
    alignItems: 'center',
  },
  subjectTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  subjectTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  sheetCount: {
    fontSize: 16,
    color: '#8E8E93',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  subjectSelector: {
    gap: 12,
  },
  subjectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  subjectOptionSelected: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  subjectOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});