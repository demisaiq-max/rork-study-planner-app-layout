import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Calendar, Camera } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';

type TestType = 'mock' | 'midterm' | 'final';

export default function TestListScreen() {
  const { subject, testType } = useLocalSearchParams<{ subject: string; testType: TestType }>();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestDate, setNewTestDate] = useState('');

  // Fetch tests for this subject and type
  const testsQuery = trpc.tests.getSubjectTests.useQuery(
    { userId: user?.id || '', subject: subject || '' },
    { enabled: !!user?.id && !!subject }
  );

  const createTestMutation = trpc.tests.createTest.useMutation({
    onSuccess: () => {
      testsQuery.refetch();
      setShowAddModal(false);
      setNewTestName('');
      setNewTestDate('');
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

  const getTestTypeLabel = (testTypeValue: TestType): string => {
    switch (testTypeValue) {
      case 'mock': return 'Mock Tests';
      case 'midterm': return 'Mid Term Tests';
      case 'final': return 'Final Tests';
      default: return '';
    }
  };

  const handleTestPress = (test: any) => {
    router.push(`/test-detail?testId=${test.id}`);
  };

  const handleAddTest = async () => {
    if (!newTestName.trim()) {
      Alert.alert(t('error'), t('enterTestName'));
      return;
    }

    if (!user?.id || !subject || !testType) return;

    try {
      await createTestMutation.mutateAsync({
        userId: user.id,
        subject,
        testType,
        testName: newTestName.trim(),
        testDate: newTestDate || undefined,
      });
    } catch (error) {
      Alert.alert(t('error'), t('failedToCreateTest'));
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
          <Text style={styles.headerTitle}>{getTestTypeLabel(testType || 'mock')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const filteredTests = testsQuery.data?.filter((test: any) => test.test_type === testType) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTestTypeLabel(testType || 'mock')}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>
            {getSubjectName(subject || '')} - {getTestTypeLabel(testType || 'mock')}
          </Text>
          
          {filteredTests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noTestsFound')}</Text>
              <Text style={styles.emptySubtext}>{t('addFirstTest')}</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>{t('addTest')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTests.map((test: any) => {
              const hasResult = test.test_results && test.test_results.length > 0;
              const result = hasResult ? test.test_results[0] : null;
              
              return (
                <TouchableOpacity
                  key={test.id}
                  style={styles.testCard}
                  onPress={() => handleTestPress(test)}
                  activeOpacity={0.7}
                >
                  <View style={styles.testContent}>
                    <View style={styles.testInfo}>
                      <Text style={styles.testName}>{test.test_name}</Text>
                      <View style={styles.testMeta}>
                        {test.test_date && (
                          <View style={styles.testDate}>
                            <Calendar size={14} color="#8E8E93" />
                            <Text style={styles.testDateText}>
                              {formatDate(test.test_date)}
                            </Text>
                          </View>
                        )}
                        {hasResult ? (
                          <View style={styles.resultInfo}>
                            <Text style={styles.gradeText}>
                              {result.grade}Grade
                            </Text>
                            <Text style={styles.percentileText}>
                              {result.percentile}%
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.noResult}>
                            <Camera size={16} color="#FF9500" />
                            <Text style={styles.noResultText}>{t('uploadAnswerSheet')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Test Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addNewTest')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('testName')}</Text>
              <TextInput
                style={styles.textInput}
                value={newTestName}
                onChangeText={setNewTestName}
                placeholder={`${getTestTypeLabel(testType || 'mock')} 1`}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('testDate')} ({t('optional')})</Text>
              <TextInput
                style={styles.textInput}
                value={newTestDate}
                onChangeText={setNewTestDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTestName('');
                  setNewTestDate('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTest}
                disabled={createTestMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {createTestMutation.isPending ? t('creating') : t('create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
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
  testsContainer: {
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
  testCard: {
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
  testContent: {
    padding: 16,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testDateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  percentileText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  noResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noResultText: {
    fontSize: 14,
    color: '#FF9500',
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
    marginBottom: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});