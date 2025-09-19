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
import { Plus, X, Edit2, Trash2, FileText, Settings } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';

interface QuestionConfig {
  number: number;
  type: 'mcq' | 'text';
}

interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  mcqQuestions?: number;
  textQuestions?: number;
  totalQuestions?: number;
  questionConfig?: QuestionConfig[]; // Dynamic question configuration
}

interface AnswerSheet {
  id: string;
  name: string;
  subjectId: string;
  testType: 'mock' | 'midterm' | 'final';
  createdAt: Date;
  questions: number;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFA726', '#AB47BC', '#26A69A', '#66BB6A',
  '#EF5350', '#42A5F5', '#FFCA28', '#8D6E63'
];

export default function AnswerSheetsScreen() {
  const { t, language } = useLanguage();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTestType, setSelectedTestType] = useState<'mock' | 'midterm' | 'final'>('mock');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetQuestions, setNewSheetQuestions] = useState('20');
  const [newTestType, setNewTestType] = useState<'mock' | 'midterm' | 'final'>('mock');
  const [editingSheet, setEditingSheet] = useState<AnswerSheet | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(DEFAULT_COLORS[0]);
  const [newSubjectMCQ, setNewSubjectMCQ] = useState('20');
  const [newSubjectText, setNewSubjectText] = useState('0');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showBubbleSheetConfig, setShowBubbleSheetConfig] = useState(false);
  const [questionConfig, setQuestionConfig] = useState<QuestionConfig[]>([]);
  const [showDynamicConfig, setShowDynamicConfig] = useState(false);
  const [dynamicTotalQuestions, setDynamicTotalQuestions] = useState('20');
  
  // Mock subjects data - in real app this would come from backend
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: '1',
      name: 'Korean (국어)',
      color: '#FF6B6B',
      createdAt: new Date('2024-01-01'),
      mcqQuestions: 34,
      textQuestions: 11,
      totalQuestions: 45,
    },
    {
      id: '2', 
      name: 'Mathematics (수학)',
      color: '#4ECDC4',
      createdAt: new Date('2024-01-01'),
      mcqQuestions: 30,
      textQuestions: 0,
      totalQuestions: 30,
    },
    {
      id: '3',
      name: 'English (영어)',
      color: '#45B7D1',
      createdAt: new Date('2024-01-01'),
      mcqQuestions: 45,
      textQuestions: 0,
      totalQuestions: 45,
    },
    {
      id: '4',
      name: 'Others (그외)',
      color: '#96CEB4',
      createdAt: new Date('2024-01-01'),
      mcqQuestions: 20,
      textQuestions: 0,
      totalQuestions: 20,
    },
  ]);
  
  // Mock data - in real app this would come from backend
  const [answerSheets, setAnswerSheets] = useState<AnswerSheet[]>([
    {
      id: '1',
      name: '2024 수능 모의고사 1회',
      subjectId: '1',
      testType: 'mock',
      createdAt: new Date('2024-01-15'),
      questions: 45,
    },
    {
      id: '2', 
      name: '중간고사 대비 문제',
      subjectId: '1',
      testType: 'midterm',
      createdAt: new Date('2024-01-10'),
      questions: 30,
    },
    {
      id: '3',
      name: '미적분 단원평가',
      subjectId: '2',
      testType: 'mock',
      createdAt: new Date('2024-01-12'),
      questions: 25,
    },
    {
      id: '4',
      name: 'TOEIC Practice Test',
      subjectId: '3',
      testType: 'final',
      createdAt: new Date('2024-01-08'),
      questions: 100,
    },
    {
      id: '5',
      name: '한국사 능력검정시험',
      subjectId: '4',
      testType: 'mock',
      createdAt: new Date('2024-01-05'),
      questions: 50,
    },
  ]);
  
  // Set initial selected subject
  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const filteredSheets = answerSheets.filter(sheet => 
    sheet.subjectId === selectedSubjectId && sheet.testType === selectedTestType
  );
  const selectedSubjectInfo = subjects.find(s => s.id === selectedSubjectId);
  
  const getTestTypeInfo = (type: 'mock' | 'midterm' | 'final') => {
    const count = answerSheets.filter(sheet => 
      sheet.subjectId === selectedSubjectId && sheet.testType === type
    ).length;
    
    switch (type) {
      case 'mock':
        return {
          title: language === 'ko' ? 'Mock Tests' : 'Mock Tests',
          subtitle: '',
          count: `${count} ${language === 'ko' ? '시험' : 'sheets'}`,
          color: '#4ECDC4'
        };
      case 'midterm':
        return {
          title: language === 'ko' ? 'Mid Term Tests' : 'Mid Term Tests',
          subtitle: '',
          count: `${count} ${language === 'ko' ? '시험' : 'sheets'}`,
          color: '#FF6B6B'
        };
      case 'final':
        return {
          title: language === 'ko' ? 'Final Tests' : 'Final Tests',
          subtitle: '',
          count: `${count} ${language === 'ko' ? '시험' : 'sheets'}`,
          color: '#45B7D1'
        };
    }
  };

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
      subjectId: selectedSubjectId,
      testType: newTestType,
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
    setNewTestType(sheet.testType);
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
        ? { ...sheet, name: newSheetName, questions: questionsNum, testType: newTestType }
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

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    const mcqCount = parseInt(newSubjectMCQ) || 0;
    const textCount = parseInt(newSubjectText) || 0;
    const totalCount = mcqCount + textCount;

    if (totalCount === 0) {
      Alert.alert('Error', 'Total questions must be greater than 0');
      return;
    }

    if (totalCount > 200) {
      Alert.alert('Error', 'Total questions cannot exceed 200');
      return;
    }

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: newSubjectName,
      color: newSubjectColor,
      createdAt: new Date(),
      mcqQuestions: mcqCount,
      textQuestions: textCount,
      totalQuestions: totalCount,
      questionConfig: showDynamicConfig ? questionConfig : undefined,
    };

    setSubjects(prev => [...prev, newSubject]);
    setSelectedSubjectId(newSubject.id);
    closeSubjectModal();
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectColor(subject.color);
    setNewSubjectMCQ((subject.mcqQuestions || 0).toString());
    setNewSubjectText((subject.textQuestions || 0).toString());
    setShowSubjectModal(true);
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || !newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    const mcqCount = parseInt(newSubjectMCQ) || 0;
    const textCount = parseInt(newSubjectText) || 0;
    const totalCount = mcqCount + textCount;

    if (totalCount === 0) {
      Alert.alert('Error', 'Total questions must be greater than 0');
      return;
    }

    if (totalCount > 200) {
      Alert.alert('Error', 'Total questions cannot exceed 200');
      return;
    }

    setSubjects(prev => prev.map(subject => 
      subject.id === editingSubject.id 
        ? { 
            ...subject, 
            name: newSubjectName, 
            color: newSubjectColor,
            mcqQuestions: mcqCount,
            textQuestions: textCount,
            totalQuestions: totalCount,
            questionConfig: showDynamicConfig ? questionConfig : undefined,
          }
        : subject
    ));
    
    closeSubjectModal();
  };

  const handleDeleteSubject = (subjectId: string) => {
    const sheetsInSubject = answerSheets.filter(sheet => sheet.subjectId === subjectId);
    
    if (sheetsInSubject.length > 0) {
      Alert.alert(
        'Cannot Delete Subject',
        `This subject contains ${sheetsInSubject.length} answer sheet(s). Please delete all answer sheets first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Subject',
      'Are you sure you want to delete this subject?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
            if (selectedSubjectId === subjectId && subjects.length > 1) {
              const remainingSubjects = subjects.filter(s => s.id !== subjectId);
              setSelectedSubjectId(remainingSubjects[0]?.id || '');
            }
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
    setNewTestType('mock');
  };

  const closeSubjectModal = () => {
    setShowSubjectModal(false);
    setEditingSubject(null);
    setNewSubjectName('');
    setNewSubjectColor(DEFAULT_COLORS[0]);
    setNewSubjectMCQ('20');
    setNewSubjectText('0');
    setShowBubbleSheetConfig(false);
    setQuestionConfig([]);
    setShowDynamicConfig(false);
    setDynamicTotalQuestions('20');
  };

  const initializeQuestionConfig = (mcq: number, text: number) => {
    const config: QuestionConfig[] = [];
    const total = mcq + text;
    
    // If we already have a config with the same total, keep it
    if (questionConfig.length === total) {
      return;
    }
    
    // Default: MCQ first, then text
    for (let i = 1; i <= mcq; i++) {
      config.push({ number: i, type: 'mcq' });
    }
    for (let i = mcq + 1; i <= mcq + text; i++) {
      config.push({ number: i, type: 'text' });
    }
    setQuestionConfig(config);
  };

  const handleQuestionTypeChange = (questionNumber: number, newType: 'mcq' | 'text') => {
    setQuestionConfig(prev => 
      prev.map(q => 
        q.number === questionNumber ? { ...q, type: newType } : q
      )
    );
  };

  const updateQuestionConfig = () => {
    const mcqCount = parseInt(newSubjectMCQ) || 0;
    const textCount = parseInt(newSubjectText) || 0;
    const totalCount = mcqCount + textCount;
    
    if (totalCount === 0) return;
    
    // If we have fewer questions configured than total, add new ones
    const newConfig = [...questionConfig];
    
    // Remove excess questions if total decreased
    if (newConfig.length > totalCount) {
      newConfig.splice(totalCount);
    }
    
    // Add new questions if total increased
    for (let i = newConfig.length + 1; i <= totalCount; i++) {
      newConfig.push({ number: i, type: 'mcq' });
    }
    
    // Update question numbers to be sequential
    newConfig.forEach((q, index) => {
      q.number = index + 1;
    });
    
    setQuestionConfig(newConfig);
  };

  // Update question config when MCQ/Text counts change
  React.useEffect(() => {
    if (showDynamicConfig) {
      updateQuestionConfig();
    } else {
      // In basic mode, update the counts based on current config
      const mcqCount = questionConfig.filter(q => q.type === 'mcq').length;
      const textCount = questionConfig.filter(q => q.type === 'text').length;
      if (mcqCount > 0 || textCount > 0) {
        setNewSubjectMCQ(mcqCount.toString());
        setNewSubjectText(textCount.toString());
      }
    }
  }, [newSubjectMCQ, newSubjectText, showDynamicConfig]);

  // Initialize config when editing a subject
  React.useEffect(() => {
    if (editingSubject && showBubbleSheetConfig) {
      if (editingSubject.questionConfig) {
        setQuestionConfig(editingSubject.questionConfig);
        setShowDynamicConfig(true);
      } else {
        initializeQuestionConfig(
          editingSubject.mcqQuestions || 0,
          editingSubject.textQuestions || 0
        );
      }
    }
  }, [editingSubject, showBubbleSheetConfig]);

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
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.subjectTab,
                selectedSubjectId === subject.id && {
                  backgroundColor: subject.color,
                  ...styles.subjectTabActive
                }
              ]}
              onPress={() => setSelectedSubjectId(subject.id)}
            >
              <Text style={[
                styles.subjectTabText,
                selectedSubjectId === subject.id && styles.subjectTabTextActive
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.manageSubjectsTab}
            onPress={() => setShowSubjectModal(true)}
          >
            <Settings size={16} color="#8E8E93" />
          </TouchableOpacity>
        </ScrollView>
      </View>



      {/* Test Type Cards with Integrated Content */}
      {selectedSubjectInfo && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {(['mock', 'midterm', 'final'] as const).map((testType) => {
            const typeInfo = getTestTypeInfo(testType);
            const typeSheets = answerSheets.filter(sheet => 
              sheet.subjectId === selectedSubjectId && sheet.testType === testType
            );
            const isExpanded = selectedTestType === testType;
            
            return (
              <View key={testType} style={styles.testTypeSection}>
                <TouchableOpacity
                  style={[
                    styles.testTypeCard,
                    isExpanded && styles.testTypeCardActive
                  ]}
                  onPress={() => {
                    if (testType === 'mock') {
                      router.push({
                        pathname: '/mock-tests',
                        params: {
                          subjectId: selectedSubjectId,
                          subjectName: selectedSubjectInfo?.name || '',
                          subjectColor: selectedSubjectInfo?.color || '#4ECDC4',
                          mcqQuestions: selectedSubjectInfo?.mcqQuestions || 20,
                          textQuestions: selectedSubjectInfo?.textQuestions || 0,
                          totalQuestions: selectedSubjectInfo?.totalQuestions || 20,
                          questionConfig: selectedSubjectInfo?.questionConfig ? JSON.stringify(selectedSubjectInfo.questionConfig) : undefined,
                        }
                      });
                    } else if (testType === 'midterm') {
                      router.push({
                        pathname: '/midterm-tests',
                        params: {
                          subjectId: selectedSubjectId,
                          subjectName: selectedSubjectInfo?.name || '',
                          subjectColor: selectedSubjectInfo?.color || '#FF9500',
                          mcqQuestions: selectedSubjectInfo?.mcqQuestions || 20,
                          textQuestions: selectedSubjectInfo?.textQuestions || 0,
                          totalQuestions: selectedSubjectInfo?.totalQuestions || 20,
                          questionConfig: selectedSubjectInfo?.questionConfig ? JSON.stringify(selectedSubjectInfo.questionConfig) : undefined,
                        }
                      });
                    } else if (testType === 'final') {
                      router.push({
                        pathname: '/final-tests',
                        params: {
                          subjectId: selectedSubjectId,
                          subjectName: selectedSubjectInfo?.name || '',
                          subjectColor: selectedSubjectInfo?.color || '#AF52DE',
                          mcqQuestions: selectedSubjectInfo?.mcqQuestions || 20,
                          textQuestions: selectedSubjectInfo?.textQuestions || 0,
                          totalQuestions: selectedSubjectInfo?.totalQuestions || 20,
                          questionConfig: selectedSubjectInfo?.questionConfig ? JSON.stringify(selectedSubjectInfo.questionConfig) : undefined,
                        }
                      });
                    }
                  }}
                >
                  <View style={styles.testTypeHeader}>
                    <Text style={[
                      styles.testTypeTitle,
                      isExpanded && styles.testTypeTitleActive
                    ]}>
                      {typeInfo.title}
                    </Text>

                  </View>
                  <Text style={[
                    styles.testTypeCount,
                    isExpanded && styles.testTypeCountActive
                  ]}>
                    {typeInfo.count}
                  </Text>



                </TouchableOpacity>


              </View>
            );
          })}
        </ScrollView>
      )}

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
                {language === 'ko' ? '시험 유형' : 'Test Type'}
              </Text>
              <View style={styles.subjectSelector}>
                {(['mock', 'midterm', 'final'] as const).map((testType) => {
                  const typeInfo = getTestTypeInfo(testType);
                  return (
                    <TouchableOpacity
                      key={testType}
                      style={[
                        styles.subjectOption,
                        newTestType === testType && {
                          backgroundColor: typeInfo.color,
                          ...styles.subjectOptionSelected
                        }
                      ]}
                      onPress={() => setNewTestType(testType)}
                    >
                      <Text style={[
                        styles.subjectOptionText,
                        newTestType === testType && styles.subjectOptionTextSelected
                      ]}>
                        {typeInfo.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '과목' : 'Subject'}
              </Text>
              <View style={styles.subjectSelector}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectOption,
                      selectedSubjectId === subject.id && {
                        backgroundColor: subject.color,
                        ...styles.subjectOptionSelected
                      }
                    ]}
                    onPress={() => setSelectedSubjectId(subject.id)}
                  >
                    <Text style={[
                      styles.subjectOptionText,
                      selectedSubjectId === subject.id && styles.subjectOptionTextSelected
                    ]}>
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Subject Management Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSubjectModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSubjectModal}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSubject 
                ? (language === 'ko' ? '과목 수정' : 'Edit Subject')
                : (language === 'ko' ? '과목 관리' : 'Manage Subjects')
              }
            </Text>
            {editingSubject ? (
              <TouchableOpacity onPress={handleUpdateSubject}>
                <Text style={styles.saveButton}>
                  {language === 'ko' ? '저장' : 'Save'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleAddSubject}>
                <Text style={styles.saveButton}>
                  {language === 'ko' ? '추가' : 'Add'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalContent}>
            {editingSubject ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ko' ? '과목 이름' : 'Subject Name'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={newSubjectName}
                    onChangeText={setNewSubjectName}
                    placeholder={language === 'ko' ? '과목 이름을 입력하세요' : 'Enter subject name'}
                    placeholderTextColor="#8E8E93"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ko' ? '색상' : 'Color'}
                  </Text>
                  <View style={styles.colorSelector}>
                    {DEFAULT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newSubjectColor === color && styles.colorOptionSelected
                        ]}
                        onPress={() => setNewSubjectColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <TouchableOpacity 
                    style={styles.bubbleSheetConfigButton}
                    onPress={() => setShowBubbleSheetConfig(!showBubbleSheetConfig)}
                  >
                    <Text style={styles.bubbleSheetConfigButtonText}>
                      {language === 'ko' ? '답안지 구성 설정' : 'Bubble Sheet Configuration'}
                    </Text>
                    <Text style={styles.bubbleSheetConfigArrow}>
                      {showBubbleSheetConfig ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showBubbleSheetConfig && (
                    <View style={styles.bubbleSheetConfig}>
                      {/* Configuration Mode Selector */}
                      <View style={styles.configModeSelector}>
                        <TouchableOpacity
                          style={[
                            styles.configModeButton,
                            !showDynamicConfig && styles.configModeButtonActive
                          ]}
                          onPress={() => {
                            setShowDynamicConfig(false);
                            initializeQuestionConfig(
                              parseInt(newSubjectMCQ) || 0,
                              parseInt(newSubjectText) || 0
                            );
                          }}
                        >
                          <Text style={[
                            styles.configModeButtonText,
                            !showDynamicConfig && styles.configModeButtonTextActive
                          ]}>
                            {language === 'ko' ? '기본 모드' : 'Basic Mode'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.configModeButton,
                            showDynamicConfig && styles.configModeButtonActive
                          ]}
                          onPress={() => {
                            setShowDynamicConfig(true);
                            if (questionConfig.length === 0) {
                              initializeQuestionConfig(
                                parseInt(newSubjectMCQ) || 0,
                                parseInt(newSubjectText) || 0
                              );
                            }
                          }}
                        >
                          <Text style={[
                            styles.configModeButtonText,
                            showDynamicConfig && styles.configModeButtonTextActive
                          ]}>
                            {language === 'ko' ? '동적 모드' : 'Dynamic Mode'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!showDynamicConfig ? (
                        <>
                          {/* Basic Mode - Simple MCQ/Text count */}
                          <View style={styles.questionTypeRow}>
                            <View style={styles.questionTypeItem}>
                              <Text style={styles.questionTypeLabel}>
                                {language === 'ko' ? 'MCQ 문제 수' : 'MCQ Questions'}
                              </Text>
                              <TextInput
                                style={styles.questionCountInput}
                                value={newSubjectMCQ}
                                onChangeText={setNewSubjectMCQ}
                                placeholder="20"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                              />
                            </View>
                            
                            <View style={styles.questionTypeItem}>
                              <Text style={styles.questionTypeLabel}>
                                {language === 'ko' ? '주관식 문제 수' : 'Text Questions'}
                              </Text>
                              <TextInput
                                style={styles.questionCountInput}
                                value={newSubjectText}
                                onChangeText={setNewSubjectText}
                                placeholder="0"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                          
                          <View style={styles.totalQuestionsContainer}>
                            <Text style={styles.totalQuestionsText}>
                              {language === 'ko' ? '총 문제 수' : 'Total Questions'}: {(parseInt(newSubjectMCQ) || 0) + (parseInt(newSubjectText) || 0)}
                            </Text>
                          </View>
                          
                          <View style={styles.configPreview}>
                            <Text style={styles.configPreviewTitle}>
                              {language === 'ko' ? '답안지 미리보기' : 'Answer Sheet Preview'}:
                            </Text>
                            <Text style={styles.configPreviewText}>
                              • MCQ (객관식): 1-{parseInt(newSubjectMCQ) || 0}번
                            </Text>
                            {(parseInt(newSubjectText) || 0) > 0 && (
                              <Text style={styles.configPreviewText}>
                                • Text (주관식): {(parseInt(newSubjectMCQ) || 0) + 1}-{(parseInt(newSubjectMCQ) || 0) + (parseInt(newSubjectText) || 0)}번
                              </Text>
                            )}
                          </View>
                        </>
                      ) : (
                        <>
                          {/* Dynamic Mode - Individual question configuration */}
                          <View style={styles.dynamicConfig}>
                            <Text style={styles.dynamicConfigTitle}>
                              {language === 'ko' ? '개별 문제 설정' : 'Individual Question Setup'}
                            </Text>
                            <Text style={styles.dynamicConfigSubtitle}>
                              {language === 'ko' ? '각 문제의 유형을 개별적으로 설정할 수 있습니다' : 'Configure each question type individually'}
                            </Text>
                            
                            {/* Quick Setup Row */}
                            <View style={styles.questionTypeRow}>
                              <View style={styles.questionTypeItem}>
                                <Text style={styles.questionTypeLabel}>
                                  {language === 'ko' ? '총 문제 수' : 'Total Questions'}
                                </Text>
                                <TextInput
                                  style={styles.questionCountInput}
                                  value={dynamicTotalQuestions}
                                  onChangeText={(value) => {
                                    // Only allow numeric input
                                    const numericValue = value.replace(/[^0-9]/g, '');
                                    setDynamicTotalQuestions(numericValue);
                                    
                                    const total = parseInt(numericValue) || 0;
                                    if (total > 0) {
                                      // Update question config to match new total
                                      const newConfig: QuestionConfig[] = [];
                                      for (let i = 1; i <= total; i++) {
                                        const existingQuestion = questionConfig.find(q => q.number === i);
                                        newConfig.push({
                                          number: i,
                                          type: existingQuestion?.type || 'mcq'
                                        });
                                      }
                                      setQuestionConfig(newConfig);
                                    } else {
                                      setQuestionConfig([]);
                                    }
                                  }}
                                  placeholder="20"
                                  placeholderTextColor="#8E8E93"
                                  keyboardType="numeric"
                                />
                              </View>
                            </View>
                            
                            {/* Individual Question Configuration */}
                            {questionConfig.length > 0 && (
                              <ScrollView style={styles.questionConfigList} nestedScrollEnabled>
                                <View style={styles.questionConfigContent}>
                                  {questionConfig.map((question) => (
                                    <View key={question.number} style={styles.questionConfigItem}>
                                      <Text style={styles.questionConfigNumber}>
                                        {question.number}
                                      </Text>
                                      <View style={styles.questionTypeSelector}>
                                        <TouchableOpacity
                                          style={[
                                            styles.questionTypeOption,
                                            question.type === 'mcq' && styles.questionTypeOptionActive
                                          ]}
                                          onPress={() => handleQuestionTypeChange(question.number, 'mcq')}
                                        >
                                          <Text style={[
                                            styles.questionTypeOptionText,
                                            question.type === 'mcq' && styles.questionTypeOptionTextActive
                                          ]}>
                                            MCQ
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={[
                                            styles.questionTypeOption,
                                            question.type === 'text' && styles.questionTypeOptionActive
                                          ]}
                                          onPress={() => handleQuestionTypeChange(question.number, 'text')}
                                        >
                                          <Text style={[
                                            styles.questionTypeOptionText,
                                            question.type === 'text' && styles.questionTypeOptionTextActive
                                          ]}>
                                            Text
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </ScrollView>
                            )}
                            
                            {/* Summary */}
                            <View style={styles.configSummary}>
                              <Text style={styles.configSummaryText}>
                                MCQ: {questionConfig.filter(q => q.type === 'mcq').length} | 
                                Text: {questionConfig.filter(q => q.type === 'text').length} | 
                                Total: {questionConfig.length}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ko' ? '새 과목 추가' : 'Add New Subject'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={newSubjectName}
                    onChangeText={setNewSubjectName}
                    placeholder={language === 'ko' ? '과목 이름을 입력하세요' : 'Enter subject name'}
                    placeholderTextColor="#8E8E93"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ko' ? '색상' : 'Color'}
                  </Text>
                  <View style={styles.colorSelector}>
                    {DEFAULT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newSubjectColor === color && styles.colorOptionSelected
                        ]}
                        onPress={() => setNewSubjectColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <TouchableOpacity 
                    style={styles.bubbleSheetConfigButton}
                    onPress={() => setShowBubbleSheetConfig(!showBubbleSheetConfig)}
                  >
                    <Text style={styles.bubbleSheetConfigButtonText}>
                      {language === 'ko' ? '답안지 구성 설정' : 'Bubble Sheet Configuration'}
                    </Text>
                    <Text style={styles.bubbleSheetConfigArrow}>
                      {showBubbleSheetConfig ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showBubbleSheetConfig && (
                    <View style={styles.bubbleSheetConfig}>
                      {/* Configuration Mode Selector */}
                      <View style={styles.configModeSelector}>
                        <TouchableOpacity
                          style={[
                            styles.configModeButton,
                            !showDynamicConfig && styles.configModeButtonActive
                          ]}
                          onPress={() => {
                            setShowDynamicConfig(false);
                            initializeQuestionConfig(
                              parseInt(newSubjectMCQ) || 0,
                              parseInt(newSubjectText) || 0
                            );
                          }}
                        >
                          <Text style={[
                            styles.configModeButtonText,
                            !showDynamicConfig && styles.configModeButtonTextActive
                          ]}>
                            {language === 'ko' ? '기본 모드' : 'Basic Mode'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.configModeButton,
                            showDynamicConfig && styles.configModeButtonActive
                          ]}
                          onPress={() => {
                            setShowDynamicConfig(true);
                            if (questionConfig.length === 0) {
                              initializeQuestionConfig(
                                parseInt(newSubjectMCQ) || 0,
                                parseInt(newSubjectText) || 0
                              );
                            }
                          }}
                        >
                          <Text style={[
                            styles.configModeButtonText,
                            showDynamicConfig && styles.configModeButtonTextActive
                          ]}>
                            {language === 'ko' ? '동적 모드' : 'Dynamic Mode'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!showDynamicConfig ? (
                        <>
                          {/* Basic Mode - Simple MCQ/Text count */}
                          <View style={styles.questionTypeRow}>
                            <View style={styles.questionTypeItem}>
                              <Text style={styles.questionTypeLabel}>
                                {language === 'ko' ? 'MCQ 문제 수' : 'MCQ Questions'}
                              </Text>
                              <TextInput
                                style={styles.questionCountInput}
                                value={newSubjectMCQ}
                                onChangeText={setNewSubjectMCQ}
                                placeholder="20"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                              />
                            </View>
                            
                            <View style={styles.questionTypeItem}>
                              <Text style={styles.questionTypeLabel}>
                                {language === 'ko' ? '주관식 문제 수' : 'Text Questions'}
                              </Text>
                              <TextInput
                                style={styles.questionCountInput}
                                value={newSubjectText}
                                onChangeText={setNewSubjectText}
                                placeholder="0"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                          
                          <View style={styles.totalQuestionsContainer}>
                            <Text style={styles.totalQuestionsText}>
                              {language === 'ko' ? '총 문제 수' : 'Total Questions'}: {(parseInt(newSubjectMCQ) || 0) + (parseInt(newSubjectText) || 0)}
                            </Text>
                          </View>
                          
                          <View style={styles.configPreview}>
                            <Text style={styles.configPreviewTitle}>
                              {language === 'ko' ? '답안지 미리보기' : 'Answer Sheet Preview'}:
                            </Text>
                            <Text style={styles.configPreviewText}>
                              • MCQ (객관식): 1-{parseInt(newSubjectMCQ) || 0}번
                            </Text>
                            {(parseInt(newSubjectText) || 0) > 0 && (
                              <Text style={styles.configPreviewText}>
                                • Text (주관식): {(parseInt(newSubjectMCQ) || 0) + 1}-{(parseInt(newSubjectMCQ) || 0) + (parseInt(newSubjectText) || 0)}번
                              </Text>
                            )}
                          </View>
                        </>
                      ) : (
                        <>
                          {/* Dynamic Mode - Individual question configuration */}
                          <View style={styles.dynamicConfig}>
                            <Text style={styles.dynamicConfigTitle}>
                              {language === 'ko' ? '개별 문제 설정' : 'Individual Question Setup'}
                            </Text>
                            <Text style={styles.dynamicConfigSubtitle}>
                              {language === 'ko' ? '각 문제의 유형을 개별적으로 설정할 수 있습니다' : 'Configure each question type individually'}
                            </Text>
                            
                            {/* Quick Setup Row */}
                            <View style={styles.questionTypeRow}>
                              <View style={styles.questionTypeItem}>
                                <Text style={styles.questionTypeLabel}>
                                  {language === 'ko' ? '총 문제 수' : 'Total Questions'}
                                </Text>
                                <TextInput
                                  style={styles.questionCountInput}
                                  value={dynamicTotalQuestions}
                                  onChangeText={(value) => {
                                    // Only allow numeric input
                                    const numericValue = value.replace(/[^0-9]/g, '');
                                    setDynamicTotalQuestions(numericValue);
                                    
                                    const total = parseInt(numericValue) || 0;
                                    if (total > 0) {
                                      // Update question config to match new total
                                      const newConfig: QuestionConfig[] = [];
                                      for (let i = 1; i <= total; i++) {
                                        const existingQuestion = questionConfig.find(q => q.number === i);
                                        newConfig.push({
                                          number: i,
                                          type: existingQuestion?.type || 'mcq'
                                        });
                                      }
                                      setQuestionConfig(newConfig);
                                    } else {
                                      setQuestionConfig([]);
                                    }
                                  }}
                                  placeholder="20"
                                  placeholderTextColor="#8E8E93"
                                  keyboardType="numeric"
                                />
                              </View>
                            </View>
                            
                            {/* Individual Question Configuration */}
                            {questionConfig.length > 0 && (
                              <ScrollView style={styles.questionConfigList} nestedScrollEnabled>
                                <View style={styles.questionConfigContent}>
                                  {questionConfig.map((question) => (
                                    <View key={question.number} style={styles.questionConfigItem}>
                                      <Text style={styles.questionConfigNumber}>
                                        {question.number}
                                      </Text>
                                      <View style={styles.questionTypeSelector}>
                                        <TouchableOpacity
                                          style={[
                                            styles.questionTypeOption,
                                            question.type === 'mcq' && styles.questionTypeOptionActive
                                          ]}
                                          onPress={() => handleQuestionTypeChange(question.number, 'mcq')}
                                        >
                                          <Text style={[
                                            styles.questionTypeOptionText,
                                            question.type === 'mcq' && styles.questionTypeOptionTextActive
                                          ]}>
                                            MCQ
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={[
                                            styles.questionTypeOption,
                                            question.type === 'text' && styles.questionTypeOptionActive
                                          ]}
                                          onPress={() => handleQuestionTypeChange(question.number, 'text')}
                                        >
                                          <Text style={[
                                            styles.questionTypeOptionText,
                                            question.type === 'text' && styles.questionTypeOptionTextActive
                                          ]}>
                                            Text
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </ScrollView>
                            )}
                            
                            {/* Summary */}
                            <View style={styles.configSummary}>
                              <Text style={styles.configSummaryText}>
                                MCQ: {questionConfig.filter(q => q.type === 'mcq').length} | 
                                Text: {questionConfig.filter(q => q.type === 'text').length} | 
                                Total: {questionConfig.length}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ko' ? '기존 과목' : 'Existing Subjects'}
                  </Text>
                  <View style={styles.subjectsList}>
                    {subjects.map((subject) => {
                      const sheetCount = answerSheets.filter(sheet => sheet.subjectId === subject.id).length;
                      return (
                        <View key={subject.id} style={styles.subjectItem}>
                          <View style={styles.subjectItemLeft}>
                            <View style={[styles.subjectColorIndicator, { backgroundColor: subject.color }]} />
                            <View>
                              <Text style={styles.subjectItemName}>{subject.name}</Text>
                              <Text style={styles.subjectItemCount}>
                                {sheetCount} {language === 'ko' ? '개 답안지' : 'answer sheets'}
                              </Text>
                              <Text style={styles.subjectItemConfig}>
                                MCQ: {subject.mcqQuestions || 0} | Text: {subject.textQuestions || 0} | Total: {subject.totalQuestions || 0}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.subjectItemActions}>
                            <TouchableOpacity 
                              style={styles.subjectActionButton}
                              onPress={() => handleEditSubject(subject)}
                            >
                              <Edit2 size={16} color="#8E8E93" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.subjectActionButton}
                              onPress={() => handleDeleteSubject(subject.id)}
                            >
                              <Trash2 size={16} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
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
  manageSubjectsTab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSubjectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000000',
  },
  subjectsList: {
    gap: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  subjectItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  subjectItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  subjectItemCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  subjectItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testTypeSection: {
    marginBottom: 16,
  },
  expandedContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  expandedContentInside: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  emptyStateInside: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitleInside: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitleInside: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  sheetsListInside: {
    gap: 12,
  },
  sheetCardInside: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sheetHeaderInside: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sheetNameInside: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sheetMetaInside: {
    fontSize: 11,
    color: '#8E8E93',
  },
  actionButtonInside: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openSheetButtonInside: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  openSheetTextInside: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  testTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testTypeCardActive: {
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  testTypeTitleActive: {
    color: '#000000',
  },
  testTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    opacity: 0,
  },
  testTypeCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  testTypeCountActive: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  testTypeSubtitle: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  testTypeSubtitleActive: {
    color: '#34C759',
  },
  subjectItemConfig: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  bubbleSheetConfigButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bubbleSheetConfigButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  bubbleSheetConfigArrow: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bubbleSheetConfig: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  questionTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  questionTypeItem: {
    flex: 1,
  },
  questionTypeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 6,
  },
  questionCountInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlign: 'center',
  },
  totalQuestionsContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
  },
  totalQuestionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  configPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    padding: 12,
  },
  configPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  configPreviewText: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },
  configModeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  configModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  configModeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  configModeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  configModeButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  dynamicConfig: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  dynamicConfigTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  dynamicConfigSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 12,
  },
  questionConfigList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  questionConfigContent: {
    gap: 8,
  },
  questionConfigItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  questionConfigNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    width: 30,
    textAlign: 'center',
  },
  questionTypeSelector: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: 2,
  },
  questionTypeOption: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  questionTypeOptionActive: {
    backgroundColor: '#007AFF',
  },
  questionTypeOptionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
  },
  questionTypeOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  configSummary: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  configSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
});