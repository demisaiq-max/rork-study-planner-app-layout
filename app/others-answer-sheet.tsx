import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/hooks/user-context';
import { trpc } from '@/lib/trpc';

type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  selectedOption?: MCQOption;
}

export default function OthersAnswerSheet() {
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
  
  const sheetName = params.name || 'Others Answer Sheet';
  const totalQuestions = parseInt(params.totalQuestions || '20');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  // Fetch answer sheet data including existing responses
  const answerSheetQuery = trpc.answerSheets.getAnswerSheetById.useQuery(
    { sheetId: params.sheetId || '' },
    { 
      enabled: !!params.sheetId,
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  );
  
  // Fetch answer sheet stats for real-time tracking
  const answerSheetStatsQuery = trpc.answerSheets.getAnswerSheetStats.useQuery(
    { sheetId: params.sheetId || '' },
    { 
      enabled: !!params.sheetId,
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  );
  
  // Save answer mutation
  const saveAnswerMutation = trpc.answerSheets.saveAnswer.useMutation({
    onSuccess: () => {
      // Refetch stats after saving answer
      answerSheetStatsQuery.refetch();
    },
    onError: (error: any) => {
      console.error('Error saving answer:', error);
      // Revert local state on error
      answerSheetQuery.refetch();
    },
  });
  
  // Delete answer mutation for deselection
  const deleteAnswerMutation = trpc.answerSheets.deleteAnswer.useMutation({
    onSuccess: () => {
      // Refetch stats after deleting answer
      answerSheetStatsQuery.refetch();
    },
    onError: (error: any) => {
      console.error('Error deleting answer:', error);
      // Revert local state on error
      answerSheetQuery.refetch();
    },
  });
  
  // Submit answer sheet mutation
  const submitAnswerSheetMutation = trpc.answerSheets.submitAnswerSheet.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      answerSheetQuery.refetch();
    },
    onError: (error: any) => {
      console.error('Error submitting answer sheet:', error);
      Alert.alert('오류', '답안지 제출 중 오류가 발생했습니다.');
    },
  });

  // Initialize questions and load existing responses
  useEffect(() => {
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= totalQuestions; i++) {
      initialQuestions.push({
        number: i,
      });
    }
    
    // Load existing responses if available
    if (answerSheetQuery.data?.responses) {
      const responsesMap = new Map();
      answerSheetQuery.data.responses.forEach((response: any) => {
        responsesMap.set(response.question_number, response);
      });
      
      initialQuestions.forEach(question => {
        const existingResponse = responsesMap.get(question.number);
        if (existingResponse && existingResponse.mcq_option) {
          question.selectedOption = existingResponse.mcq_option as MCQOption;
        }
      });
    }
    
    setQuestions(initialQuestions);
    
    // Check if answer sheet is already submitted
    if (answerSheetQuery.data?.status === 'submitted' || answerSheetQuery.data?.status === 'graded') {
      setIsSubmitted(true);
    }
    
    console.log('Others Answer Sheet initialized with', initialQuestions.length, 'questions');
  }, [totalQuestions, answerSheetQuery.data]);

  const handleMCQSelect = (questionNumber: number, option: MCQOption) => {
    if (isSubmitted) return; // Prevent editing if submitted
    
    const question = questions.find(q => q.number === questionNumber);
    if (!question || !params.sheetId) return;
    
    const newOption = question.selectedOption === option ? undefined : option;
    
    // Update local state immediately for responsive UI
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, selectedOption: newOption }
        : q
    ));
    
    // Always save to database (both selection and deselection)
    if (user?.id) {
      if (newOption) {
        // Save selected option
        saveAnswerMutation.mutate({
          sheetId: params.sheetId,
          questionNumber,
          questionType: 'mcq',
          mcqOption: newOption,
        });
      } else {
        // Delete the answer when deselected
        deleteAnswerMutation.mutate({
          sheetId: params.sheetId,
          questionNumber,
        });
      }
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) {
      // If already submitted, just show results
      router.back();
      return;
    }
    
    const stats = answerSheetStatsQuery.data;
    const totalAnswered = stats?.total_answered || 0;
    const completionPercentage = Math.round((totalAnswered / totalQuestions) * 100);
    
    Alert.alert(
      '답안지 제출',
      `Others (그외)\n총 ${totalQuestions}문제 중 ${totalAnswered}문제 답변완료 (${completionPercentage}%)\n\n제출하시겠습니까?\n\n제출 후에는 답안을 수정할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            if (params.sheetId) {
              // Collect all current answers
              const currentAnswers = questions
                .filter(q => q.selectedOption)
                .map(q => ({
                  questionNumber: q.number,
                  questionType: 'mcq' as const,
                  mcqOption: q.selectedOption,
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
            const completionPercentage = Math.round((totalAnswered / totalQuestions) * 100);
            
            return (
              <View style={styles.headerStats}>
                <Text style={styles.headerStatsText}>
                  {totalAnswered}/{totalQuestions} ({completionPercentage}%)
                </Text>
              </View>
            );
          },
        }} 
      />
      
      <View style={styles.headerInfo}>
        <Text style={styles.subjectTitle}>Others (그외)</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.questionCount}>총 {totalQuestions}문제 (객관식)</Text>
          {answerSheetStatsQuery.data && (
            <Text style={styles.progressText}>
              {answerSheetStatsQuery.data.total_answered}개 답변완료 ({Math.round((answerSheetStatsQuery.data.total_answered / totalQuestions) * 100)}%)
            </Text>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.sheetContainer}>
          {questions.map(question => renderMCQQuestion(question))}
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
    backgroundColor: '#96CEB4',
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
    borderColor: '#96CEB4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bubbleSelected: {
    backgroundColor: '#96CEB4',
    borderColor: '#96CEB4',
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#96CEB4',
  },
  bubbleTextSelected: {
    color: '#FFFFFF',
  },
  
  // Submit Button
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#96CEB4',
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