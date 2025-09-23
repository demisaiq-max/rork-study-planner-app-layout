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

interface QuestionConfig {
  number: number;
  type: 'mcq' | 'text';
}

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
    mcqEnd: 30, // Questions 1-30 are all MCQ (Common 1-22, Elective 23-30)
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
  const subject = params.subject as string || 'custom';
  const sheetName = params.name as string || 'New Answer Sheet';
  const mcqQuestions = parseInt(params.mcqQuestions as string) || 20;
  const textQuestions = parseInt(params.textQuestions as string) || 0;
  const totalQuestions = parseInt(params.totalQuestions as string) || 20;
  const subjectName = params.subjectName as string || 'Custom Subject';
  const questionConfigParam = params.questionConfig as string;
  
  // Parse dynamic question configuration if provided
  let dynamicQuestionConfig: QuestionConfig[] | undefined;
  try {
    if (questionConfigParam) {
      dynamicQuestionConfig = JSON.parse(questionConfigParam);
    }
  } catch (error) {
    console.warn('Failed to parse questionConfig:', error);
  }
  
  // Create dynamic config based on parameters
  const config: SubjectConfig = {
    name: subjectName,
    commonQuestions: mcqQuestions,
    electiveQuestions: textQuestions,
    totalQuestions: totalQuestions,
    mcqEnd: mcqQuestions,
  };
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Initialize questions based on custom configuration
  useEffect(() => {
    console.log(`Initializing ${config.totalQuestions} questions for subject: ${config.name}`);
    console.log(`MCQ: ${mcqQuestions}, Text: ${textQuestions}`);
    
    const initialQuestions: Question[] = [];
    
    if (dynamicQuestionConfig && dynamicQuestionConfig.length > 0) {
      // Use dynamic configuration if available
      console.log('Using dynamic question configuration:', dynamicQuestionConfig);
      for (const questionConfig of dynamicQuestionConfig) {
        initialQuestions.push({
          number: questionConfig.number,
          type: questionConfig.type,
        });
      }
    } else {
      // Fallback to default configuration (MCQ first, then text)
      for (let i = 1; i <= config.totalQuestions; i++) {
        const questionType: AnswerType = i <= mcqQuestions ? 'mcq' : 'text';
        
        initialQuestions.push({
          number: i,
          type: questionType,
        });
      }
    }
    
    console.log(`Created ${initialQuestions.length} questions`);
    console.log('Question types:', initialQuestions.map(q => `${q.number}:${q.type}`).join(', '));
    setQuestions(initialQuestions);
  }, [mcqQuestions, textQuestions, config.totalQuestions, config.name, dynamicQuestionConfig]);

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
    if (!config) return;
    
    const answeredQuestions = questions.filter(q => 
      q.type === 'mcq' ? q.selectedOption : q.textAnswer?.trim()
    );
    
    Alert.alert(
      '제출 결과 보기',
      `${config.name}\n총 ${config.totalQuestions}문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', `${config.name} 답안지가 제출되었습니다.`);
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



  const renderSubjectSheet = () => {
    if (!config) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Invalid subject configuration</Text>
        </View>
      );
    }

    if (questions.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading {config.name}...</Text>
        </View>
      );
    }

    return (
      <View style={styles.pageContainer}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{config.name}</Text>
          <Text style={styles.pageSubtitle}>
            MCQ: {questions.filter(q => q.type === 'mcq').length}문제 | 
            Text: {questions.filter(q => q.type === 'text').length}문제 | 
            Total: {config.totalQuestions}문제
          </Text>
          {dynamicQuestionConfig ? (
            <Text style={styles.pageDescription}>
              동적 구성: 각 문제 유형이 개별적으로 설정됨
            </Text>
          ) : (
            <Text style={styles.pageDescription}>
              {mcqQuestions > 0 && `문제 1-${mcqQuestions}: 객관식 (MCQ)`}
              {textQuestions > 0 && mcqQuestions > 0 && ' | '}
              {textQuestions > 0 && `문제 ${mcqQuestions + 1}-${config.totalQuestions}: 주관식 (Text)`}
            </Text>
          )}
        </View>
        
        <View style={styles.answerGrid}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridHeaderText}>문번</Text>
            <Text style={styles.gridHeaderText}>답안</Text>
          </View>
          
          {questions.map(question => 
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
      


      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderSubjectSheet()}
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
  },
  answerGrid: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
  },
  gridHeaderText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
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
    borderBottomColor: '#E5E5EA',
    minHeight: 70,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  textQuestionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    minHeight: 90,
    alignItems: 'stretch',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  questionNumber: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    height: '100%',
  },
  questionNumberText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  optionsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  optionBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  optionBubbleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionBubbleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  optionBubbleTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
  },
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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