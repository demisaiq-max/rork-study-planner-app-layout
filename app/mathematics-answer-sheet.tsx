import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/hooks/user-context';
import { trpc } from '@/lib/trpc';

type AnswerType = 'mcq' | 'text';
type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  type: AnswerType;
  selectedOption?: MCQOption;
  textAnswer?: string;
}

export default function MathematicsAnswerSheet() {
  const { user } = useUser();
  const params = useLocalSearchParams<{
    sheetId: string;
    name: string;
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    mcqQuestions: string;
    textQuestions: string;
    totalQuestions: string;
    questionConfig?: string;
  }>();
  
  const sheetName = params.name || 'Mathematics Answer Sheet';
  const totalQuestions = parseInt(params.totalQuestions || '30');
  const mcqQuestions = parseInt(params.mcqQuestions || '30');
  const textQuestions = parseInt(params.textQuestions || '0');
  
  console.log('Mathematics Answer Sheet Params:', {
    totalQuestions,
    mcqQuestions,
    textQuestions,
    sheetId: params.sheetId
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  // Fetch answer sheet data including existing responses
  const answerSheetQuery = trpc.answerSheets.getAnswerSheetById.useQuery(
    { sheetId: params.sheetId || '' },
    { 
      enabled: !!params.sheetId,
      refetchInterval: 2000,
    }
  );
  
  // Fetch answer sheet stats for real-time tracking
  const answerSheetStatsQuery = trpc.answerSheets.getAnswerSheetStats.useQuery(
    { sheetId: params.sheetId || '' },
    { 
      enabled: !!params.sheetId,
      refetchInterval: 2000,
    }
  );
  
  // Save answer mutation
  const saveAnswerMutation = trpc.answerSheets.saveAnswer.useMutation({
    onSuccess: () => {
      answerSheetStatsQuery.refetch();
      answerSheetQuery.refetch();
    },
    onError: (error) => {
      console.error('Error saving answer:', error);
    },
  });
  
  // Submit answer sheet mutation
  const submitAnswerSheetMutation = trpc.answerSheets.submitAnswerSheet.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      answerSheetQuery.refetch();
    },
    onError: (error) => {
      console.error('Error submitting answer sheet:', error);
      Alert.alert('오류', '답안지 제출 중 오류가 발생했습니다.');
    },
  });
  
  // Initialize questions and load existing responses with real-time updates
  useEffect(() => {
    // ALWAYS wait for database data if sheetId is provided - this ensures real-time updates
    if (params.sheetId && !answerSheetQuery.data) {
      console.log('⏳ Waiting for database data for sheet ID:', params.sheetId);
      return;
    }
    
    // If no sheetId, we can't proceed without database data
    if (!answerSheetQuery.data) {
      console.log('❌ No database data available and no sheet ID provided');
      return;
    }
    
    console.log('=== REAL-TIME MATHEMATICS ANSWER SHEET UPDATE ===');
    console.log('Initializing questions with database data:', answerSheetQuery.data);
    
    const initialQuestions: Question[] = [];
    
    // ALWAYS use the latest data from the database for real-time updates
    const latestTotalQuestions = answerSheetQuery.data.total_questions;
    const latestMcqQuestions = answerSheetQuery.data.mcq_questions || answerSheetQuery.data.total_questions;
    const latestTextQuestions = answerSheetQuery.data.text_questions || 0;
    
    console.log('Using REAL-TIME configuration from database:', {
      latestTotalQuestions,
      latestMcqQuestions,
      latestTextQuestions,
      sheetId: answerSheetQuery.data.id
    });
    
    // Parse dynamic question configuration if provided
    let dynamicQuestionConfig: any[] | undefined;
    try {
      if (params.questionConfig) {
        dynamicQuestionConfig = JSON.parse(params.questionConfig);
        console.log('Using dynamic question config:', dynamicQuestionConfig);
      }
    } catch (error) {
      console.warn('Failed to parse questionConfig:', error);
    }
    
    if (dynamicQuestionConfig && dynamicQuestionConfig.length > 0) {
      // Use dynamic configuration if available
      for (const questionConfig of dynamicQuestionConfig) {
        initialQuestions.push({
          number: questionConfig.number,
          type: questionConfig.type,
        });
      }
    } else {
      // Use ONLY the real-time configuration from database
      console.log('🔢 Creating questions with database config:', {
        total: latestTotalQuestions,
        mcq: latestMcqQuestions,
        text: latestTextQuestions
      });
      
      for (let i = 1; i <= latestTotalQuestions; i++) {
        const questionType: AnswerType = i <= latestMcqQuestions ? 'mcq' : 'text';
        console.log(`Question ${i}: type = ${questionType} (i <= ${latestMcqQuestions} = ${i <= latestMcqQuestions})`);
        initialQuestions.push({
          number: i,
          type: questionType,
        });
      }
    }
    
    // Load existing responses if available
    if (answerSheetQuery.data.responses) {
      const responsesMap = new Map();
      answerSheetQuery.data.responses.forEach((response: any) => {
        responsesMap.set(response.question_number, response);
      });
      
      initialQuestions.forEach(question => {
        const existingResponse = responsesMap.get(question.number);
        if (existingResponse) {
          if (question.type === 'mcq' && existingResponse.mcq_option) {
            question.selectedOption = existingResponse.mcq_option as MCQOption;
          } else if (question.type === 'text' && existingResponse.text_answer) {
            question.textAnswer = existingResponse.text_answer;
          }
        }
      });
    }
    
    // ALWAYS update questions to reflect real-time changes from database
    console.log('Updating questions with real-time data:', {
      total: latestTotalQuestions,
      mcq: latestMcqQuestions,
      text: latestTextQuestions,
      questionsLength: initialQuestions.length
    });
    setQuestions(initialQuestions);
    
    // Check if answer sheet is already submitted
    if (answerSheetQuery.data.status === 'submitted' || answerSheetQuery.data.status === 'graded') {
      setIsSubmitted(true);
    } else {
      setIsSubmitted(false);
    }
    
    console.log('✅ Mathematics Answer Sheet updated with', initialQuestions.length, 'questions');
    console.log('Question types:', initialQuestions.map(q => `${q.number}:${q.type}`).join(', '));
    console.log('=== END REAL-TIME UPDATE ===');
  }, [answerSheetQuery.data, params.questionConfig]);

  const handleMCQSelect = (questionNumber: number, option: MCQOption) => {
    if (isSubmitted) return;
    
    const question = questions.find(q => q.number === questionNumber);
    if (!question || !params.sheetId) return;
    
    const newOption = question.selectedOption === option ? undefined : option;
    
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, selectedOption: newOption }
        : q
    ));
    
    // Save to database if option is selected
    if (newOption && user?.id) {
      saveAnswerMutation.mutate({
        sheetId: params.sheetId,
        questionNumber,
        questionType: 'mcq',
        mcqOption: newOption,
      });
    }
  };

  const handleTextAnswer = (questionNumber: number, text: string) => {
    if (isSubmitted) return; // Prevent editing if submitted
    
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, textAnswer: text }
        : q
    ));
    
    // Save to database with debounce
    if (text.trim() && params.sheetId && user?.id) {
      // Simple debounce - save after user stops typing for 1 second
      setTimeout(() => {
        const currentQuestion = questions.find(q => q.number === questionNumber);
        if (currentQuestion?.textAnswer === text) {
          saveAnswerMutation.mutate({
            sheetId: params.sheetId,
            questionNumber,
            questionType: 'text',
            textAnswer: text,
          });
        }
      }, 1000);
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) {
      router.back();
      return;
    }
    
    const stats = answerSheetStatsQuery.data;
    const totalAnswered = stats?.total_answered || 0;
    const currentTotalQuestions = answerSheetQuery.data?.total_questions || totalQuestions;
    const completionPercentage = Math.round((totalAnswered / currentTotalQuestions) * 100);
    
    Alert.alert(
      '답안지 제출',
      `Mathematics (수학)\n총 ${currentTotalQuestions}문제 중 ${totalAnswered}문제 답변완료 (${completionPercentage}%)\n\n제출하시겠습니까?\n\n제출 후에는 답안을 수정할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            if (params.sheetId) {
              // Collect all current answers
              const currentAnswers = questions
                .filter(q => 
                  (q.type === 'mcq' && q.selectedOption) || 
                  (q.type === 'text' && q.textAnswer?.trim())
                )
                .map(q => ({
                  questionNumber: q.number,
                  questionType: q.type,
                  mcqOption: q.type === 'mcq' ? q.selectedOption : undefined,
                  textAnswer: q.type === 'text' ? q.textAnswer : undefined,
                }));
              
              submitAnswerSheetMutation.mutate({ 
                sheetId: params.sheetId,
                answers: currentAnswers
              });
            }
          }
        }
      ]
    );
  };

  const renderMCQQuestion = (question: Question) => {
    return (
      <View key={question.number} style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumberText}>{question.number}</Text>
        </View>
        <View style={styles.bubbleRow}>
          {[1, 2, 3, 4, 5].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.bubble,
                question.selectedOption === option && styles.bubbleSelected,
                isSubmitted && styles.bubbleDisabled
              ]}
              onPress={() => handleMCQSelect(question.number, option as MCQOption)}
              activeOpacity={isSubmitted ? 1 : 0.7}
              disabled={isSubmitted}
            >
              <Text style={[
                styles.bubbleText,
                question.selectedOption === option && styles.bubbleTextSelected
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
      <View key={question.number} style={styles.textQuestionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumberText}>{question.number}</Text>
        </View>
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              isSubmitted && styles.textInputDisabled
            ]}
            value={question.textAnswer || ''}
            onChangeText={(text) => handleTextAnswer(question.number, text)}
            placeholder={isSubmitted ? "제출된 답안" : "답안을 입력하세요"}
            placeholderTextColor="#999999"
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
            editable={!isSubmitted}
          />
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
          headerRight: () => {
            const stats = answerSheetStatsQuery.data;
            const totalAnswered = stats?.total_answered || 0;
            const currentTotalQuestions = answerSheetQuery.data?.total_questions || totalQuestions;
            const completionPercentage = Math.round((totalAnswered / currentTotalQuestions) * 100);
            
            return (
              <View style={styles.headerStats}>
                <Text style={styles.headerStatsText}>
                  {totalAnswered}/{currentTotalQuestions} ({completionPercentage}%)
                </Text>
              </View>
            );
          },
        }} 
      />
      
      <View style={styles.headerInfo}>
        <Text style={styles.subjectTitle}>Mathematics (수학)</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.questionCount}>
            총 {answerSheetQuery.data?.total_questions || totalQuestions}문제 (객관식 {questions.filter(q => q.type === 'mcq').length}문제, 주관식 {questions.filter(q => q.type === 'text').length}문제)
          </Text>
          {answerSheetStatsQuery.data && (
            <Text style={styles.progressText}>
              {answerSheetStatsQuery.data.total_answered}개 답변완료 ({Math.round((answerSheetStatsQuery.data.total_answered / (answerSheetQuery.data?.total_questions || totalQuestions)) * 100)}%)
            </Text>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.sheetContainer}>
          {questions.map(question => 
            question.type === 'mcq' 
              ? renderMCQQuestion(question)
              : renderTextQuestion(question)
          )}
        </View>
      </ScrollView>

      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isSubmitted && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
        >
          <Text style={[
            styles.submitButtonText,
            isSubmitted && styles.submitButtonTextDisabled
          ]}>
            {isSubmitted ? '제출 완료' : '답안지 제출'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerStats: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  headerStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  headerInfo: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsContainer: {
    gap: 4,
  },
  questionCount: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  sheetContainer: {
    padding: 16,
  },
  
  // MCQ Question Styles
  questionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionNumberText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bubbleSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  bubbleTextSelected: {
    color: '#FFFFFF',
  },
  
  // Text Question Styles
  textQuestionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  
  // Submit Button
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Disabled states
  bubbleDisabled: {
    opacity: 0.6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonTextDisabled: {
    color: '#666666',
  },
});