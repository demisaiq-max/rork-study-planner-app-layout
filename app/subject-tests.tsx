import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronRight, Plus, Database } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';

type TestType = 'mock' | 'midterm' | 'final';

export default function SubjectTestsScreen() {
  const { subject, examTitle } = useLocalSearchParams<{ subject: string; examTitle?: string }>();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tests for this subject
  const testsQuery = trpc.tests.getSubjectTests.useQuery(
    { userId: user?.id || '', subject: subject || '' },
    { enabled: !!user?.id && !!subject }
  );

  const seedDataMutation = trpc.tests.seedTestData.useMutation({
    onSuccess: () => {
      testsQuery.refetch();
      Alert.alert(t('success'), 'Test data seeded successfully!');
    },
    onError: (error) => {
      Alert.alert(t('error'), error.message);
    },
  });

  useEffect(() => {
    if (testsQuery.data !== undefined) {
      setIsLoading(false);
    }
  }, [testsQuery.data]);

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

  const getTestTypeLabel = (testType: TestType): string => {
    switch (testType) {
      case 'mock': return 'Mock Tests';
      case 'midterm': return 'Mid Term Tests';
      case 'final': return 'Final Tests';
      default: return '';
    }
  };

  const handleTestTypePress = (testType: TestType) => {
    router.push(`/test-list?subject=${encodeURIComponent(subject || '')}&testType=${testType}`);
  };

  const getTestsCountByType = (testType: TestType): number => {
    return testsQuery.data?.filter((test: any) => test.test_type === testType).length || 0;
  };

  const getLatestResultByType = (testType: TestType): any => {
    const testsOfType = testsQuery.data?.filter((test: any) => test.test_type === testType) || [];
    const testsWithResults = testsOfType.filter((test: any) => test.test_results && test.test_results.length > 0);
    
    if (testsWithResults.length === 0) return null;
    
    // Get the most recent test with results
    const latestTest = testsWithResults.sort((a: any, b: any) => 
      new Date(b.test_date || b.created_at).getTime() - new Date(a.test_date || a.created_at).getTime()
    )[0];
    
    return latestTest.test_results[0];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {examTitle ? `${examTitle} - ${getSubjectName(subject || '')}` : getSubjectName(subject || '')}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const testTypes: TestType[] = ['mock', 'midterm', 'final'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getSubjectName(subject || '')}</Text>
        <TouchableOpacity 
          onPress={() => {
            if (user?.id) {
              seedDataMutation.mutate({ userId: user.id });
            }
          }}
          style={styles.seedButton}
          disabled={seedDataMutation.isPending}
        >
          <Database size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.testTypesContainer}>
          {examTitle && (
            <View style={styles.examInfoCard}>
              <Text style={styles.examInfoTitle}>Exam: {examTitle}</Text>
              <Text style={styles.examInfoSubject}>Subject: {getSubjectName(subject || '')}</Text>
              <Text style={styles.examInfoDescription}>View all tests for this subject to prepare for your exam</Text>
            </View>
          )}
          <Text style={styles.sectionTitle}>{t('testTypes')}</Text>
          
          {testTypes.map((testType) => {
            const testsCount = getTestsCountByType(testType);
            const latestResult = getLatestResultByType(testType);
            
            return (
              <TouchableOpacity
                key={testType}
                style={styles.testTypeCard}
                onPress={() => handleTestTypePress(testType)}
                activeOpacity={0.7}
              >
                <View style={styles.testTypeContent}>
                  <View style={styles.testTypeInfo}>
                    <Text style={styles.testTypeName}>
                      {getTestTypeLabel(testType)}
                    </Text>
                    <View style={styles.testTypeStats}>
                      <Text style={styles.testCount}>
                        {testsCount} {t('tests')}
                      </Text>
                      {latestResult && (
                        <Text style={styles.latestGrade}>
                          {t('latestGrade')}: {latestResult.grade}{t('gradeUnit')} ({latestResult.percentile}%)
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={20} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            );
          })}
          
          {(!testsQuery.data || testsQuery.data.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noTestsFound')}</Text>
              <Text style={styles.emptySubtext}>{t('addTestsToGetStarted')}</Text>
            </View>
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
  seedButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testTypesContainer: {
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
  testTypeCard: {
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
  testTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  testTypeInfo: {
    flex: 1,
  },
  testTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  testTypeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  latestGrade: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  examInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  examInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  examInfoSubject: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  examInfoDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
});