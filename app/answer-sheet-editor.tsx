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
    name: '국어 학력평가 작은',
    commonQuestions: 34,
    electiveQuestions: 11,
    totalQuestions: 45,
    mcqEnd: 15, // Questions 1-15 are MCQ, 16+ are text
  },
  mathematics: {
    name: '수학',
    commonQuestions: 22,
    electiveQuestions: 8,
    totalQuestions: 30,
    mcqEnd: 15, // Questions 1-15 are MCQ
    multipleSelectionStart: 16,
    multipleSelectionEnd: 22,
  },
  english: {
    name: '영어',
    commonQuestions: 45,
    electiveQuestions: 0,
    totalQuestions: 45,
    mcqEnd: 45, // All questions are MCQ
  },
  others: {
    name: '그외',
    commonQuestions: 20,
    electiveQuestions: 0,
    totalQuestions: 20,
    mcqEnd: 20, // All questions are MCQ
  },
};

export default function AnswerSheetEditor() {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const subject = params.subject as string || 'korean';
  const sheetName = params.name as string || 'New Answer Sheet';
  
  const config = SUBJECT_CONFIGS[subject] || SUBJECT_CONFIGS.korean;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Initialize questions based on subject
  useEffect(() => {
    if (!config) return;
    
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= config.totalQuestions; i++) {
      const isMCQ = config.mcqEnd ? i <= config.mcqEnd : true;
      initialQuestions.push({
        number: i,
        type: isMCQ ? 'mcq' : 'text',
      });
    }
    setQuestions(initialQuestions);
  }, [subject, config]);

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
    const answeredQuestions = questions.filter(q => 
      q.type === 'mcq' ? q.selectedOption : q.textAnswer?.trim()
    );
    
    Alert.alert(
      '제출 결과 보기',
      `총 ${config.totalQuestions}문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', '답안지가 제출되었습니다.');
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
                styles.optionButton,
                question.selectedOption === option && styles.optionButtonSelected
              ]}
              onPress={() => handleMCQSelect(question.number, option as MCQOption)}
            >
              <Text style={[
                styles.optionText,
                question.selectedOption === option && styles.optionTextSelected
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
          <View style={styles.textAnswerBox} />
        </View>
      </View>
    );
  };

  const renderQuestionsPage = (startQuestion: number, endQuestion: number) => {
    const pageQuestions = questions.filter(q => 
      q.number >= startQuestion && q.number <= endQuestion
    );

    return (
      <View style={styles.pageContainer}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{config.name}</Text>
        </View>
        
        <View style={styles.answerGrid}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridHeaderText}>문번</Text>
            <Text style={styles.gridHeaderText}>답</Text>
            <Text style={styles.gridHeaderText}>란</Text>
          </View>
          
          {pageQuestions.map(question => 
            question.type === 'mcq' 
              ? renderMCQQuestion(question)
              : renderTextQuestion(question)
          )}
        </View>
      </View>
    );
  };

  const getPageInfo = () => {
    if (!config) return [{ start: 1, end: 1, title: 'Loading...' }];
    
    if (subject === 'korean') {
      return [
        { start: 1, end: 15, title: 'MCQ Questions 1-15' },
        { start: 16, end: 45, title: 'Text Questions 16-45' }
      ];
    } else if (subject === 'mathematics') {
      return [
        { start: 1, end: 15, title: 'MCQ Questions 1-15' },
        { start: 16, end: 30, title: 'Text Questions 16-30' }
      ];
    } else {
      return [
        { start: 1, end: config.totalQuestions, title: 'All Questions' }
      ];
    }
  };

  const pages = getPageInfo();
  const currentPageInfo = pages[currentPage] || pages[0];

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
      
      {/* Page Navigation */}
      {pages.length > 1 && (
        <View style={styles.pageNavigation}>
          {pages.map((page, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageTab,
                currentPage === index && styles.pageTabActive
              ]}
              onPress={() => setCurrentPage(index)}
            >
              <Text style={[
                styles.pageTabText,
                currentPage === index && styles.pageTabTextActive
              ]}>
                {page.start}-{page.end}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {config && currentPageInfo ? renderQuestionsPage(currentPageInfo.start, currentPageInfo.end) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
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
  pageNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  pageTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 12,
  },
  pageTabActive: {
    backgroundColor: '#007AFF',
  },
  pageTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  pageTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  answerGrid: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  gridHeaderText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  questionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 50,
  },
  textQuestionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 60,
  },
  questionNumber: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    backgroundColor: '#F8F8F8',
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
    paddingHorizontal: 5,
    justifyContent: 'space-evenly',
  },
  optionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  optionButtonSelected: {
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  textAnswerContainer: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  textAnswerBox: {
    height: 40,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
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