import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';




export default function SubjectGradesScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subjects from backend
  const subjectsQuery = trpc.tests.getUserSubjects.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  // Fetch latest test results for statistics display
  const latestResultsQuery = trpc.tests.getLatestTestResults.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  useEffect(() => {
    if (subjectsQuery.data !== undefined) {
      setIsLoading(false);
    }
  }, [subjectsQuery.data]);



  const handleSubjectPress = (subject: string) => {
    router.push(`/subject-tests?subject=${encodeURIComponent(subject)}`);
  };

  const getLatestGradeForSubject = (subject: string): number | null => {
    const latestResult = latestResultsQuery.data?.find(
      (result: any) => result.tests.subject === subject
    );
    return latestResult?.grade || null;
  };

  const getSubjectName = (subject: string): string => {
    const koreanToKey: { [key: string]: string } = {
      '국어': 'korean',
      '영어': 'english', 
      '수학': 'math',
      '탐구': 'science',
      '예체능': 'arts',
    };
    
    const key = koreanToKey[subject];
    if (key) {
      return t(key);
    }
    
    return subject;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('subjectGrades')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subjectGrades')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.subjectsContainer}>
          <Text style={styles.sectionTitle}>{t('subjects')}</Text>
          
          {!subjectsQuery.data || subjectsQuery.data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noSubjectsFound')}</Text>
              <Text style={styles.emptySubtext}>{t('takeTestsToSeeSubjects')}</Text>
            </View>
          ) : (
            subjectsQuery.data.map((subject: string) => {
              const latestGrade = getLatestGradeForSubject(subject);
              
              return (
                <TouchableOpacity
                  key={subject}
                  style={styles.subjectCard}
                  onPress={() => handleSubjectPress(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectContent}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>
                        {getSubjectName(subject)}
                      </Text>
                      <Text style={styles.subjectGrade}>
                        {latestGrade ? `${t('latestGrade')}: ${latestGrade}${t('gradeUnit')}` : t('noGradesYet')}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#8E8E93" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },



  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  subjectsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
  subjectCard: {
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
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  subjectGrade: {
    fontSize: 14,
    color: '#8E8E93',
  },

});