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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Plus, X, Edit2, Trash2, FileText, ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';

interface AnswerSheet {
  id: string;
  name: string;
  subjectId: string;
  testType: 'mock' | 'midterm' | 'final';
  createdAt: Date;
  questions: number;
}

export default function MidtermTestsScreen() {
  const { language } = useLanguage();
  const params = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
    subjectColor: string;
  }>();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetQuestions, setNewSheetQuestions] = useState('20');
  const [editingSheet, setEditingSheet] = useState<AnswerSheet | null>(null);
  
  // Mock data - in real app this would come from backend
  const [answerSheets, setAnswerSheets] = useState<AnswerSheet[]>([
    {
      id: '1',
      name: '2024 중간고사 1차',
      subjectId: params.subjectId || '1',
      testType: 'midterm',
      createdAt: new Date('2024-01-15'),
      questions: 30,
    },
    {
      id: '2',
      name: '미적분 중간고사',
      subjectId: params.subjectId || '2',
      testType: 'midterm',
      createdAt: new Date('2024-01-12'),
      questions: 25,
    },
    {
      id: '3',
      name: '한국사 중간고사',
      subjectId: params.subjectId || '4',
      testType: 'midterm',
      createdAt: new Date('2024-01-05'),
      questions: 40,
    },
  ]);
  
  const filteredSheets = answerSheets.filter(sheet => 
    sheet.subjectId === params.subjectId && sheet.testType === 'midterm'
  );

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
      subjectId: params.subjectId || '1',
      testType: 'midterm',
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
          title: language === 'ko' ? 'Midterm Tests' : 'Midterm Tests',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.subjectIndicator, { backgroundColor: params.subjectColor || '#FF9500' }]} />
          <View>
            <Text style={styles.headerTitle}>{params.subjectName || 'Midterm Tests'}</Text>
            <Text style={styles.headerSubtitle}>
              {language === 'ko' ? '최근 성적: 1등급 (98%)' : 'Recent Score: Grade 1 (98%)'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: params.subjectColor || '#FF9500' }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredSheets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>
              {language === 'ko' ? '중간고사가 없습니다' : 'No Midterm Tests'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'ko' ? '새 중간고사를 만들어보세요' : 'Create your first midterm test'}
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
                  style={[styles.openSheetButton, { backgroundColor: (params.subjectColor || '#FF9500') + '20' }]}
                  onPress={() => {
                    router.push({
                      pathname: '/answer-sheet-editor',
                      params: {
                        subject: sheet.subjectId,
                        name: sheet.name,
                        questions: sheet.questions.toString()
                      }
                    });
                  }}
                >
                  <Text style={[styles.openSheetText, { color: params.subjectColor || '#FF9500' }]}>
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
                ? (language === 'ko' ? '중간고사 수정' : 'Edit Midterm Test')
                : (language === 'ko' ? '새 중간고사' : 'New Midterm Test')
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
                {language === 'ko' ? '중간고사 이름' : 'Midterm Test Name'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={newSheetName}
                onChangeText={setNewSheetName}
                placeholder={language === 'ko' ? '중간고사 이름을 입력하세요' : 'Enter midterm test name'}
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