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
import { useLanguage } from '@/hooks/language-context';

type MCQOption = 1 | 2 | 3 | 4 | 5;

interface Question {
  number: number;
  selectedOption?: MCQOption;
}

export default function EnglishAnswerSheet() {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const sheetName = params.name as string || 'English Answer Sheet';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Initialize English questions: 1-45 all MCQ (Common)
  useEffect(() => {
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= 45; i++) {
      initialQuestions.push({
        number: i,
      });
    }
    setQuestions(initialQuestions);
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
        <View style={styles.pageContainer}>
          <View style={styles.answerGrid}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridHeaderText}>문번</Text>
              <Text style={styles.gridHeaderText}>답안</Text>
            </View>
            
            {questions.map(question => renderMCQQuestion(question))}
          </View>
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

  questionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 70,
    alignItems: 'center',
  },
  questionNumber: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    backgroundColor: '#F8F8F8',
    paddingVertical: 10,
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
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    paddingVertical: 15,
    minHeight: 70,
  },
  optionBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  optionBubbleSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionBubbleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  optionBubbleTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});