import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Plus, MoreVertical } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';




export default function SubjectGradesScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');

  // Fetch subjects from backend
  const subjectsQuery = trpc.tests.getUserSubjects.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  // Fetch latest test results for statistics display
  const latestResultsQuery = trpc.tests.getLatestTestResults.useQuery(
    user?.id || 'default-user',
    { enabled: !!user?.id }
  );

  const createSubjectMutation = trpc.tests.createSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      setShowAddModal(false);
      setNewSubjectName('');
    },
    onError: (error) => {
      Alert.alert(t('error'), error.message === 'Subject already exists' ? t('subjectAlreadyExists') : t('failedToAddSubject'));
    },
  });

  const deleteSubjectMutation = trpc.tests.deleteSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      latestResultsQuery.refetch();
    },
    onError: (error) => {
      Alert.alert(t('error'), t('failedToDeleteSubject'));
    },
  });

  const updateSubjectMutation = trpc.tests.updateSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      latestResultsQuery.refetch();
      setShowEditModal(false);
      setEditingSubject(null);
      setEditSubjectName('');
    },
    onError: (error) => {
      Alert.alert(t('error'), error.message === 'Subject already exists' ? t('subjectAlreadyExists') : t('failedToUpdateSubject'));
    },
  });

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

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert(t('error'), t('enterSubjectName'));
      return;
    }

    if (!user?.id) return;

    try {
      await createSubjectMutation.mutateAsync({
        userId: user.id,
        subject: newSubjectName.trim(),
      });
    } catch {
      // Error is handled in the mutation's onError callback
    }
  };

  const handleEditSubject = async () => {
    if (!editSubjectName.trim() || !editingSubject) {
      Alert.alert(t('error'), t('enterSubjectName'));
      return;
    }

    if (!user?.id) return;

    try {
      await updateSubjectMutation.mutateAsync({
        userId: user.id,
        oldSubject: editingSubject,
        newSubject: editSubjectName.trim(),
      });
    } catch {
      // Error is handled in the mutation's onError callback
    }
  };

  const handleSubjectOptions = (subject: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('cancel'), t('edit'), t('delete')],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Edit
            setEditingSubject(subject);
            setEditSubjectName(subject);
            setShowEditModal(true);
          } else if (buttonIndex === 2) {
            // Delete
            handleDeleteSubject(subject);
          }
        }
      );
    } else {
      Alert.alert(
        t('subjectOptions'),
        t('chooseAction'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('edit'),
            onPress: () => {
              setEditingSubject(subject);
              setEditSubjectName(subject);
              setShowEditModal(true);
            },
          },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: () => handleDeleteSubject(subject),
          },
        ]
      );
    }
  };

  const handleDeleteSubject = (subject: string) => {
    Alert.alert(
      t('deleteSubject'),
      t('deleteSubjectConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await deleteSubjectMutation.mutateAsync({
                userId: user.id,
                subject,
              });
            } catch {
              // Error is handled in the mutation's onError callback
            }
          },
        },
      ]
    );
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
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subjectGrades')}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.subjectsContainer}>
          <Text style={styles.sectionTitle}>{t('subjects')}</Text>
          
          {!subjectsQuery.data || subjectsQuery.data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noSubjectsFound')}</Text>
              <Text style={styles.emptySubtext}>{t('takeTestsToSeeSubjects')}</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>{t('addSubject')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            subjectsQuery.data.map((subject: string) => {
              const latestGrade = getLatestGradeForSubject(subject);
              
              return (
                <View key={subject} style={styles.subjectCard}>
                  <TouchableOpacity
                    style={styles.subjectContent}
                    onPress={() => handleSubjectPress(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>
                        {getSubjectName(subject)}
                      </Text>
                      <Text style={styles.subjectGrade}>
                        {latestGrade ? `${t('latestGrade')}: ${latestGrade}${t('gradeUnit')}` : t('noGradesYet')}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => handleSubjectOptions(subject)}
                    activeOpacity={0.7}
                  >
                    <MoreVertical size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addSubject')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('subjectName')}</Text>
              <TextInput
                style={styles.textInput}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder={t('enterSubjectName')}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewSubjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddSubject}
                disabled={createSubjectMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {createSubjectMutation.isPending ? t('creating') : t('create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('editSubject')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('subjectName')}</Text>
              <TextInput
                style={styles.textInput}
                value={editSubjectName}
                onChangeText={setEditSubjectName}
                placeholder={t('enterSubjectName')}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingSubject(null);
                  setEditSubjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditSubject}
                disabled={updateSubjectMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {updateSubjectMutation.isPending ? t('updating') : t('update')}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionsButton: {
    padding: 16,
    paddingLeft: 8,
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
  addFirstButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
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