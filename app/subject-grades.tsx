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
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';

const { width } = Dimensions.get('window');

type ExamType = 'mock' | 'midterm' | 'final';
type SubjectGrade = {
  subject: string;
  mockGrade?: number;
  midtermGrade?: number;
  finalGrade?: number;
};

const SUBJECTS = ['국어', '영어', '수학', '탐구', '예체능'];
const EXAM_TYPES: { key: ExamType; label: string; color: string }[] = [
  { key: 'mock', label: '모의고사', color: '#007AFF' },
  { key: 'midterm', label: '중간고사', color: '#34C759' },
  { key: 'final', label: '기말고사', color: '#FF9500' },
];

export default function SubjectGradesScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('mock');
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [stats, setStats] = useState({
    targetPercentile: 89,
    averagePercentile: 50,
    recentPercentile: 68,
  });

  // Initialize subject grades
  useEffect(() => {
    const initialGrades: SubjectGrade[] = SUBJECTS.map(subject => ({
      subject,
      mockGrade: Math.floor(Math.random() * 9) + 1, // Random grade 1-9 for demo
      midtermGrade: Math.floor(Math.random() * 9) + 1,
      finalGrade: Math.floor(Math.random() * 9) + 1,
    }));
    setSubjectGrades(initialGrades);
  }, []);

  // Update stats based on selected exam type and grades
  useEffect(() => {
    const currentGrades = subjectGrades.map(sg => {
      switch (selectedExamType) {
        case 'mock': return sg.mockGrade || 5;
        case 'midterm': return sg.midtermGrade || 5;
        case 'final': return sg.finalGrade || 5;
        default: return 5;
      }
    });
    
    const average = currentGrades.reduce((sum, grade) => sum + grade, 0) / currentGrades.length;
    const percentile = Math.max(10, Math.min(99, Math.round((10 - average) * 10 + 50)));
    
    setStats(prev => ({
      ...prev,
      recentPercentile: percentile,
      averagePercentile: Math.round((prev.averagePercentile + percentile) / 2),
    }));
  }, [selectedExamType, subjectGrades]);

  const updateGrade = (subject: string, grade: number) => {
    setSubjectGrades(prev => prev.map(sg => {
      if (sg.subject === subject) {
        return {
          ...sg,
          [`${selectedExamType}Grade`]: grade,
        };
      }
      return sg;
    }));
  };

  const getCurrentGrade = (subjectGrade: SubjectGrade): number | undefined => {
    switch (selectedExamType) {
      case 'mock': return subjectGrade.mockGrade;
      case 'midterm': return subjectGrade.midtermGrade;
      case 'final': return subjectGrade.finalGrade;
      default: return undefined;
    }
  };

  const getGradeTrend = (subjectGrade: SubjectGrade): 'up' | 'down' | 'same' => {
    const mock = subjectGrade.mockGrade || 5;
    const midterm = subjectGrade.midtermGrade || 5;
    const final = subjectGrade.finalGrade || 5;
    
    if (selectedExamType === 'midterm') {
      if (midterm < mock) return 'up'; // Lower grade number = better
      if (midterm > mock) return 'down';
      return 'same';
    }
    
    if (selectedExamType === 'final') {
      if (final < midterm) return 'up';
      if (final > midterm) return 'down';
      return 'same';
    }
    
    return 'same';
  };

  const selectedExamInfo = EXAM_TYPES.find(et => et.key === selectedExamType)!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>과목별 성적</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.targetPercentile}</Text>
            <Text style={styles.statLabel}>목표 백분위</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averagePercentile}</Text>
            <Text style={styles.statLabel}>평균 백분위</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.recentPercentile}</Text>
            <Text style={styles.statLabel}>최근 백분위</Text>
          </View>
        </View>

        {/* Exam Type Selector */}
        <View style={styles.examTypeContainer}>
          <Text style={styles.sectionTitle}>시험 유형</Text>
          <View style={styles.examTypeButtons}>
            {EXAM_TYPES.map((examType) => (
              <TouchableOpacity
                key={examType.key}
                style={[
                  styles.examTypeButton,
                  selectedExamType === examType.key && {
                    backgroundColor: examType.color,
                  },
                ]}
                onPress={() => setSelectedExamType(examType.key)}
              >
                <Text
                  style={[
                    styles.examTypeButtonText,
                    selectedExamType === examType.key && styles.examTypeButtonTextSelected,
                  ]}
                >
                  {examType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject Grades */}
        <View style={styles.gradesContainer}>
          <Text style={styles.sectionTitle}>
            {selectedExamInfo.label} 성적
          </Text>
          
          {subjectGrades.map((subjectGrade) => {
            const currentGrade = getCurrentGrade(subjectGrade);
            const trend = getGradeTrend(subjectGrade);
            
            return (
              <View key={subjectGrade.subject} style={styles.subjectGradeCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subjectGrade.subject}</Text>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.currentGrade}>
                      {currentGrade ? `${currentGrade}등급` : '미정'}
                    </Text>
                    {trend !== 'same' && (
                      <View style={styles.trendIcon}>
                        {trend === 'up' ? (
                          <TrendingUp size={16} color="#34C759" />
                        ) : (
                          <TrendingDown size={16} color="#FF3B30" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.gradeSelector}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeOption,
                        currentGrade === grade && {
                          backgroundColor: selectedExamInfo.color,
                          borderColor: selectedExamInfo.color,
                        },
                      ]}
                      onPress={() => updateGrade(subjectGrade.subject, grade)}
                    >
                      <Text
                        style={[
                          styles.gradeOptionText,
                          currentGrade === grade && styles.gradeOptionTextSelected,
                        ]}
                      >
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Grade History */}
                <View style={styles.gradeHistory}>
                  <Text style={styles.historyLabel}>성적 변화:</Text>
                  <View style={styles.historyGrades}>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyType}>모의</Text>
                      <Text style={styles.historyGrade}>
                        {subjectGrade.mockGrade ? `${subjectGrade.mockGrade}등급` : '-'}
                      </Text>
                    </View>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyType}>중간</Text>
                      <Text style={styles.historyGrade}>
                        {subjectGrade.midtermGrade ? `${subjectGrade.midtermGrade}등급` : '-'}
                      </Text>
                    </View>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyType}>기말</Text>
                      <Text style={styles.historyGrade}>
                        {subjectGrade.finalGrade ? `${subjectGrade.finalGrade}등급` : '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  examTypeContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  examTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  examTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  examTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  examTypeButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradesContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  subjectGradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  gradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentGrade: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  trendIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gradeOption: {
    width: (width - 40 - 32 - 64) / 9, // Responsive width
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gradeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  gradeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gradeHistory: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  historyLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  historyGrades: {
    flexDirection: 'row',
    gap: 16,
  },
  historyItem: {
    alignItems: 'center',
  },
  historyType: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  historyGrade: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
});