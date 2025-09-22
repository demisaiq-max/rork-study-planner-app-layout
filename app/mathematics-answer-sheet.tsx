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

type MCQOption = 1 | 2 | 3 | 4 | 5;
type AnswerType = 'mcq' | 'text';

interface Question {
  number: number;
  type: AnswerType;
  selectedOption?: MCQOption;
  textAnswer?: string;
  isMultipleSelection?: boolean;
}

export default function MathematicsAnswerSheet() {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const sheetName = params.name as string || 'Mathematics Answer Sheet';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Initialize Mathematics questions:
  // 1-22: MCQ (Common) with multiple selection for 16-22
  // 23-30: Text input (Elective) with multiple selection for 29-30
  useEffect(() => {
    const initialQuestions: Question[] = [];
    for (let i = 1; i <= 30; i++) {
      const isElective = i >= 23;
      const isMultipleSelection = (i >= 16 && i <= 22) || (i >= 29 && i <= 30);
      
      initialQuestions.push({
        number: i,
        type: isElective ? 'text' : 'mcq',
        isMultipleSelection,
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

  const handleTextChange = (questionNumber: number, text: string) => {
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
      `Mathematics (수학)\n총 30문제 중 ${answeredQuestions.length}문제 답변완료\n\n제출하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: () => {
            Alert.alert('제출 완료', 'Mathematics 답안지가 제출되었습니다.');
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
      <View key={question.number} style={styles.questionRow}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{question.number}</Text>
        </View>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            value={question.textAnswer || ''}
            onChangeText={(text) => handleTextChange(question.number, text)}
            placeholder="답안을 입력하세요"
            placeholderTextColor="#999999"
            multiline
            textAlignVertical="top"
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
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageContainer}>
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
    minHeight: 60,
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
    paddingHorizontal: 8,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
  optionBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
  },
  optionBubbleSelected: {
    backgroundColor: '#000000',
  },
  optionBubbleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  optionBubbleTextSelected: {
    color: '#FFFFFF',
  },

  textInputContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 40,
    textAlignVertical: 'top',
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