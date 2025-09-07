import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';
import { useStudyStore } from '@/hooks/study-store';

interface TestResult {
  id: string;
  grade: number;
  percentile: number;
  target_percentile: number;
  average_percentile: number;
  created_at: string;
  tests: {
    subject: string;
    test_name: string;
    test_type: string;
    test_date: string;
  };
}

export default function TestResultsScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const { updateHomeStats } = useStudyStore();

  // Fetch latest test results
  const resultsQuery = trpc.tests.getLatestTestResults.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (resultsQuery.data !== undefined) {
      setIsLoading(false);
    }
  }, [resultsQuery.data]);

  const getSubjectName = (subjectName: string): string => {
    const koreanToKey: { [key: string]: string } = {
      '국어': 'korean',
      '영어': 'english', 
      '수학': 'math',
      '탐구': 'science',
      '예체능': 'arts',
    };
    
    const key = koreanToKey[subjectName];
    if (key) {
      return t(key);
    }
    
    return subjectName;
  };

  const getTestTypeLabel = (testType: string): string => {
    switch (testType) {
      case 'mock': return 'Mock';
      case 'midterm': return 'Mid Term';
      case 'final': return 'Final Exam';
      default: return testType;
    }
  };

  const handleResultPress = (result: TestResult) => {
    // Toggle selection
    const newSelectedId = selectedResult === result.id ? null : result.id;
    setSelectedResult(newSelectedId);
    
    // Update home screen stats if selected
    if (newSelectedId && updateHomeStats) {
      updateHomeStats({
        targetPercentile: result.target_percentile || 89,
        averagePercentile: result.average_percentile || 50,
        recentPercentile: result.percentile,
      });
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('testResults')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const gradedResults = resultsQuery.data?.filter((result: TestResult) => 
    result.grade && result.percentile
  ) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('testResults')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>{t('gradedTests')}</Text>
          
          {gradedResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noGradedTests')}</Text>
              <Text style={styles.emptySubtext}>{t('completeTestsToSeeResults')}</Text>
            </View>
          ) : (
            gradedResults.map((result: TestResult) => {
              const isSelected = selectedResult === result.id;
              
              return (
                <TouchableOpacity
                  key={result.id}
                  style={[
                    styles.resultCard,
                    isSelected && styles.resultCardSelected
                  ]}
                  onPress={() => handleResultPress(result)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultContent}>
                    <View style={styles.resultHeader}>
                      <Text style={[
                        styles.subjectName,
                        isSelected && styles.subjectNameSelected
                      ]}>
                        {getSubjectName(result.tests.subject)}
                      </Text>
                      <Text style={[
                        styles.testType,
                        isSelected && styles.testTypeSelected
                      ]}>
                        {getTestTypeLabel(result.tests.test_type)} {result.tests.test_name.match(/\d+/)?.[0] || '1'}
                      </Text>
                    </View>
                    
                    <View style={styles.resultStats}>
                      <View style={styles.statItem}>
                        <Text style={[
                          styles.statValue,
                          isSelected && styles.statValueSelected
                        ]}>
                          {result.grade}
                        </Text>
                        <Text style={[
                          styles.statLabel,
                          isSelected && styles.statLabelSelected
                        ]}>
                          {t('grade')}
                        </Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={[
                          styles.statValue,
                          isSelected && styles.statValueSelected
                        ]}>
                          {result.percentile}%
                        </Text>
                        <Text style={[
                          styles.statLabel,
                          isSelected && styles.statLabelSelected
                        ]}>
                          {t('percentile')}
                        </Text>
                      </View>
                      
                      {result.tests.test_date && (
                        <View style={styles.statItem}>
                          <Text style={[
                            styles.dateText,
                            isSelected && styles.dateTextSelected
                          ]}>
                            {formatDate(result.tests.test_date)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  resultCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F8FBFF',
  },
  resultContent: {
    padding: 16,
  },
  resultHeader: {
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  subjectNameSelected: {
    color: '#007AFF',
  },
  testType: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  testTypeSelected: {
    color: '#007AFF',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  statValueSelected: {
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statLabelSelected: {
    color: '#007AFF',
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dateTextSelected: {
    color: '#007AFF',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});