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

type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  selectedOption?: MCQOption;
}

export default function EnglishAnswerSheet() {
  const params = useLocalSearchParams();
  const sheetName = params.name as string || 'English Answer Sheet';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Initialize English questions: 1-45 all MCQ
  useEffect(() => {
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= 45; i++) {
      initialQuestions.push({
        number: i,
      });
    }
    setQuestions(initialQuestions);
    console.log('English Answer Sheet initialized with', initialQuestions.length, 'questions');
  }, []);

  const handleMCQSelect = (questionNumber: number, option: MCQOption) => {
    setQuestions(prev => prev.map(q => 
      q.number === questionNumber 
        ? { ...q, selectedOption: q.selectedOption === option ? undefined : option }
        : q
    ));
  };

  const handleSubmit = () => {
    const answeredQuestions = questions.filter(q => q.selectedOption);
    
    Alert.alert(
      '제출 결과 보기',
      `English (영어)\n총 45문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', 'English 답안지가 제출되었습니다.');
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
        <Text style={styles.subjectTitle}>English (영어)</Text>
        <Text style={styles.questionCount}>총 45문제 (객관식)</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.sheetContainer}>
          {questions.map(question => renderMCQQuestion(question))}
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
    backgroundColor: '#45B7D1',
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
    borderColor: '#45B7D1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bubbleSelected: {
    backgroundColor: '#45B7D1',
    borderColor: '#45B7D1',
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#45B7D1',
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
    backgroundColor: '#45B7D1',
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