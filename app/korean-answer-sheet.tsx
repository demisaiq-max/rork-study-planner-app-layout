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
import { useLanguage } from '@/hooks/language-context';

type AnswerType = 'mcq' | 'text';
type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  type: AnswerType;
  selectedOption?: MCQOption;
  textAnswer?: string;
}

export default function KoreanAnswerSheet() {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const sheetName = params.name as string || 'Korean Answer Sheet';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Initialize Korean questions: 1-34 MCQ (Common), 35-45 Text (Elective)
  useEffect(() => {
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= 45; i++) {
      const questionType: AnswerType = i <= 34 ? 'mcq' : 'text';
      initialQuestions.push({
        number: i,
        type: questionType,
      });
    }
    setQuestions(initialQuestions);
    console.log('Korean Answer Sheet initialized with', initialQuestions.length, 'questions');
  }, []);

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
      `Korean (국어)\n총 45문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', 'Korean 답안지가 제출되었습니다.');
            router.back();
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
                question.selectedOption === option && styles.bubbleSelected
              ]}
              onPress={() => handleMCQSelect(question.number, option as MCQOption)}
              activeOpacity={0.7}
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
            style={styles.textInput}
            value={question.textAnswer || ''}
            onChangeText={(text) => handleTextAnswer(question.number, text)}
            placeholder="답안을 입력하세요"
            placeholderTextColor="#999999"
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
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
        }} 
      />
      
      <View style={styles.headerInfo}>
        <Text style={styles.subjectTitle}>Korean (국어)</Text>
        <Text style={styles.questionCount}>총 45문제 (객관식 34문제, 주관식 11문제)</Text>
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
    backgroundColor: '#FFFFFF',
  },
  headerInfo: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  questionCount: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
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
    borderColor: '#FF6B6B',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bubbleSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
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
  
  // Submit Button
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
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
});