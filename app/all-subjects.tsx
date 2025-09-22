import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';

export default function AllSubjectsScreen() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<{id: string, name: string} | null>(null);
  const [editedSubjectName, setEditedSubjectName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch all user subjects
  const subjectsQuery = trpc.tests.getUserSubjects.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  // Mutations
  const createSubjectMutation = trpc.tests.createSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      setIsAddModalVisible(false);
      setNewSubjectName('');
      Alert.alert('Success', 'Subject created successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create subject');
    },
  });

  const updateSubjectMutation = trpc.tests.updateSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      setIsEditModalVisible(false);
      setEditingSubject(null);
      setEditedSubjectName('');
      Alert.alert('Success', 'Subject updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update subject');
    },
  });

  const deleteSubjectMutation = trpc.tests.deleteSubject.useMutation({
    onSuccess: () => {
      subjectsQuery.refetch();
      Alert.alert('Success', 'Subject deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to delete subject');
    },
  });

  useEffect(() => {
    if (subjectsQuery.data !== undefined) {
      setIsLoading(false);
    }
  }, [subjectsQuery.data]);

  const getSubjectName = useCallback((subjectName: string): string => {
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
  }, [t]);

  const handleSubjectPress = useCallback((subjectName: string) => {
    if (!isEditMode) {
      router.push(`/subject-tests?subject=${encodeURIComponent(subjectName)}`);
    }
  }, [isEditMode]);

  const handleAddSubject = useCallback(() => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    createSubjectMutation.mutate({
      userId: user.id,
      name: newSubjectName.trim(),
    });
  }, [newSubjectName, user?.id, createSubjectMutation]);

  const handleEditSubject = useCallback((subject: {id: string, name: string}) => {
    setEditingSubject(subject);
    setEditedSubjectName(subject.name);
    setIsEditModalVisible(true);
  }, []);

  const handleUpdateSubject = useCallback(() => {
    if (!editedSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    if (!user?.id || !editingSubject) {
      Alert.alert('Error', 'Invalid request');
      return;
    }

    updateSubjectMutation.mutate({
      id: editingSubject!.id,
      userId: user.id,
      name: editedSubjectName.trim(),
    });
  }, [editedSubjectName, user?.id, editingSubject, updateSubjectMutation]);

  const handleDeleteSubject = useCallback((subject: {id: string, name: string}) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete "${subject.name}"? This will also delete all tests and results for this subject.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!user?.id) return;
            deleteSubjectMutation.mutate({
              id: subject.id,
              userId: user.id,
            });
          },
        },
      ]
    );
  }, [user?.id, deleteSubjectMutation]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Subjects</Text>
          <View style={styles.editButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  const subjects = subjectsQuery.data || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Subjects</Text>
        <TouchableOpacity 
          onPress={() => setIsEditMode(!isEditMode)} 
          style={styles.editButton}
        >
          <Text style={[styles.editButtonText, isEditMode && styles.editButtonTextActive]}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.subjectsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select a Subject</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddModalVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {subjects.map((subject: any) => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              onPress={() => handleSubjectPress(subject.name)}
              activeOpacity={0.7}
            >
              <View style={styles.subjectContent}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>
                    {getSubjectName(subject.name)}
                  </Text>
                  <Text style={styles.subjectSubtext}>
                    View tests and grades
                  </Text>
                </View>
                {isEditMode ? (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditSubject({id: subject.id, name: subject.name})}
                    >
                      <Edit2 size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteSubject({id: subject.id, name: subject.name})}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ChevronRight size={20} color="#8E8E93" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {subjects.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No subjects found</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add subjects</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewSubjectName('');
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Enter subject name"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddSubject}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewSubjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddSubject}
                disabled={createSubjectMutation.isPending}
              >
                {createSubjectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add Subject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Subject</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingSubject(null);
                  setEditedSubjectName('');
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Enter new subject name"
              value={editedSubjectName}
              onChangeText={setEditedSubjectName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleUpdateSubject}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingSubject(null);
                  setEditedSubjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateSubject}
                disabled={updateSubjectMutation.isPending}
              >
                {updateSubjectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Update Subject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  editButtonTextActive: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
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
  subjectSubtext: {
    fontSize: 14,
    color: '#8E8E93',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});