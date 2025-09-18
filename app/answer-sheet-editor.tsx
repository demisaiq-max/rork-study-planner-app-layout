import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/hooks/language-context';

type AnswerType = 'mcq' | 'text';
type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  type: AnswerType;
  selectedOption?: MCQOption;
  textAnswer?: string;
}

interface SubjectConfig {
  name: string;
  commonQuestions: number;
  electiveQuestions: number;
  totalQuestions: number;
  mcqEnd?: number; // Last question number that is MCQ
  multipleSelectionStart?: number; // Start of multiple selection questions
  multipleSelectionEnd?: number; // End of multiple selection questions
}

const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  korean: {
    name: '국어 (Korean)',
    commonQuestions: 34,
    electiveQuestions: 11,
    totalQuestions: 45,
    mcqEnd: 34, // Questions 1-34 are MCQ (Common), 35-45 are text (Elective)
  },
  mathematics: {
    name: '수학 (Mathematics)',
    commonQuestions: 22,
    electiveQuestions: 8,
    totalQuestions: 30,
    mcqEnd: 30, // All questions are MCQ, with multiple selection for 16-22 and 29-30
    multipleSelectionStart: 16,
    multipleSelectionEnd: 22,
  },
  english: {
    name: '영어 (English)',
    commonQuestions: 45,
    electiveQuestions: 0,
    totalQuestions: 45,
    mcqEnd: 45, // All questions 1-45 are MCQ (Common)
  },
  others: {
    name: '그외 (Others)',
    commonQuestions: 20,
    electiveQuestions: 0,
    totalQuestions: 20,
    mcqEnd: 20, // All questions 1-20 are MCQ (Common)
  },
};

export default function AnswerSheetEditor() {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const subject = params.subject as string || 'korean';
  const sheetName = params.name as string || 'New Answer Sheet';
  
  const config = SUBJECT_CONFIGS[subject] || SUBJECT_CONFIGS.korean;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>(subject);
  const [availableSubjects] = useState<string[]>(['korean', 'mathematics', 'english', 'others']);
  
  // Initialize questions when current subject changes
  useEffect(() => {
    const currentConfig = SUBJECT_CONFIGS[currentSubject];
    if (!currentConfig) return;
    
    console.log(`Initializing ${currentConfig.totalQuestions} questions for subject: ${currentSubject}`);
    
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= currentConfig.totalQuestions; i++) {
      let questionType: AnswerType = 'mcq';
      
      if (currentSubject === 'korean') {
        // Korean: 1-34 MCQ (Common), 35-45 Text (Elective)
        questionType = i <= 34 ? 'mcq' : 'text';
        console.log(`Korean Question ${i}: ${questionType}`);
      } else if (currentSubject === 'mathematics') {
        // Mathematics: All questions 1-30 are MCQ (1-22 Common, 23-30 Elective)
        // 16-22 and 29-30 are multiple selection but still MCQ type
        questionType = 'mcq';
      } else if (currentSubject === 'english') {
        // English: All questions 1-45 are MCQ (Common)
        questionType = 'mcq';
      } else if (currentSubject === 'others') {
        // Others: All questions 1-20 are MCQ (Common)
        questionType = 'mcq';
      }
      
      initialQuestions.push({
        number: i,
        type: questionType,
      });
    }
    
    console.log(`Created ${initialQuestions.length} questions for ${currentSubject}`);
    console.log('Question types:', initialQuestions.map(q => `${q.number}:${q.type}`).join(', '));
    setQuestions(initialQuestions);
  }, [currentSubject]);

  const handleMCQSelect = (questionNumber: number, option: MCQOption) => {
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, selectedOption: q.selectedOption === option ? undefined : option }
        : q
    ));
  };

  const handleTextAnswer = (questionNumber: number, text: string) => {
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, textAnswer: text }
        : q
    ));
  };

  const handleSubmit = () => {
    const currentConfig = SUBJECT_CONFIGS[currentSubject];
    if (!currentConfig) return;
    
    const currentQuestions = questions.filter(q => q.number <= currentConfig.totalQuestions);
    const answeredQuestions = currentQuestions.filter(q => 
      q.type === 'mcq' ? q.selectedOption : q.textAnswer?.trim()
    );
    
    Alert.alert(
      '제출 결과 보기',
      `${currentConfig.name}\n총 ${currentConfig.totalQuestions}문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', `${currentConfig.name} 답안지가 제출되었습니다.`);
            router.back();
          }
        }
      ]
    );
  };

  const renderMCQQuestion = (question: Question) => {
    return (
      <View key={question.number} style={styles.questionRow}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{question.number}</Text>
        </View>
        <View style={styles.optionsContainer}>
          {[1, 2, 3, 4, 5].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionBubble,
                question.selectedOption === option && styles.optionBubbleSelected
              ]}
              onPress={() => handleMCQSelect(question.number, option as MCQOption)}
            >
              <Text style={[
                styles.optionBubbleText,
                question.selectedOption === option && styles.optionBubbleTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTextQuestion = (question: Question) => {
    return (
      <View key={question.number} style={styles.textQuestionRow}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{question.number}</Text>
        </View>
        <View style={styles.textAnswerContainer}>
          <TextInput
            style={styles.textAnswerBox}
            value={question.textAnswer || ''}
            onChangeText={(text) => handleTextAnswer(question.number, text)}
            placeholder="답안을 입력하세요"
            placeholderTextColor="#8E8E93"
            multiline={true}
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>
      </View>
    );
  };

  const renderSubjectTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
          {availableSubjects.map((subjectKey) => {
            const subjectConfig = SUBJECT_CONFIGS[subjectKey];
            return (
              <TouchableOpacity
                key={subjectKey}
                style={[
                  styles.tab,
                  currentSubject === subjectKey && styles.activeTab
                ]}
                onPress={() => setCurrentSubject(subjectKey)}
              >
                <Text style={[
                  styles.tabText,
                  currentSubject === subjectKey && styles.activeTabText
                ]}>
                  {subjectConfig.name}
                </Text>
                <Text style={[
                  styles.tabSubtext,
                  currentSubject === subjectKey && styles.activeTabSubtext
                ]}>
                  {subjectConfig.totalQuestions}문제
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderCurrentSubjectSheet = () => {
    const currentConfig = SUBJECT_CONFIGS[currentSubject];
    
    // Add null check for currentConfig
    if (!currentConfig) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Invalid subject configuration</Text>
        </View>
      );
    }
    
    const currentQuestions = questions.filter(q => {
      // Filter questions based on current subject's total questions
      return q.number <= currentConfig.totalQuestions;
    });

    // Generate questions for current subject if not already generated
    if (currentQuestions.length === 0 || currentQuestions.length !== currentConfig.totalQuestions) {
      const subjectQuestions: Question[] = [];
      for (let i = 1; i <= currentConfig.totalQuestions; i++) {
        let questionType: AnswerType = 'mcq';
        
        if (currentSubject === 'korean') {
          // Korean: 1-34 MCQ (Common), 35-45 Text (Elective)
          questionType = i <= 34 ? 'mcq' : 'text';
        } else {
          // All other subjects: All MCQ
          questionType = 'mcq';
        }
        
        subjectQuestions.push({
          number: i,
          type: questionType,
        });
      }
      
      // Update questions state with current subject questions
      setQuestions(prev => {
        const otherSubjectQuestions = prev.filter(q => {
          // Keep questions from other subjects
          return false; // For now, we'll regenerate all questions
        });
        return [...otherSubjectQuestions, ...subjectQuestions];
      });
      
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading {currentConfig.name}...</Text>
        </View>
      );
    }

    return (
      <View style={styles.pageContainer}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{currentConfig.name}</Text>
          <Text style={styles.pageSubtitle}>
            Common: {currentConfig.commonQuestions}문제 | 
            {currentConfig.electiveQuestions > 0 ? `Elective: ${currentConfig.electiveQuestions}문제 | ` : ''}
            Total: {currentConfig.totalQuestions}문제
          </Text>
          {currentSubject === 'korean' && (
            <Text style={styles.pageDescription}>
              문제 1-34: 객관식 (Common) | 문제 35-45: 주관식 (Elective)
            </Text>
          )}
          {currentSubject === 'mathematics' && (
            <Text style={styles.pageDescription}>
              문제 1-22: 객관식 (Common) | 문제 23-30: 객관식 (Elective)
              {"\n"}문제 16-22, 29-30: 복수선택 가능
            </Text>
          )}
        </View>
        
        <View style={styles.answerGrid}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridHeaderText}>문번</Text>
            <Text style={styles.gridHeaderText}>답안</Text>
          </View>
          
          {currentQuestions.map(question => 
            question.type === 'mcq' 
              ? renderMCQQuestion(question)
              : renderTextQuestion(question)
          )}
        </View>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: sheetName,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      


      {renderSubjectTabs()}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderCurrentSubjectSheet()}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>제출 결과 보기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  pageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
  },
  answerGrid: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 8,
  },
  gridHeaderText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 10,
  },
  tabScrollContainer: {
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabSubtext: {
    fontSize: 10,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  activeTabSubtext: {
    color: '#FFFFFF',
  },
  pageDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  questionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 60,
    alignItems: 'center',
  },
  textQuestionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 80,
    alignItems: 'stretch',
    paddingVertical: 10,
  },
  questionNumber: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    backgroundColor: '#F8F8F8',
    height: '100%',
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  optionsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  optionBubble: {
    width: 32,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionBubbleSelected: {
    backgroundColor: '#000000',
  },
  optionBubbleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  optionBubbleTextSelected: {
    color: '#FFFFFF',
  },
  textAnswerContainer: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    paddingVertical: 5,
  },
  textAnswerBox: {
    minHeight: 60,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#D3D3D3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});