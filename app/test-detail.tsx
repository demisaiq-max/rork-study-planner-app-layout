import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Upload, CheckCircle } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';
import * as ImagePicker from 'expo-image-picker';

export default function TestDetailScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { user } = useUser();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch test details
  const testQuery = trpc.tests.getTestById.useQuery(
    { testId: testId || '' },
    { enabled: !!testId }
  );

  const submitResultMutation = trpc.tests.submitTestResult.useMutation({
    onSuccess: () => {
      testQuery.refetch();
      Alert.alert(t('success'), t('testResultSubmitted'));
    },
  });

  const currentTest = testQuery.data;
  const hasResult = currentTest?.test_results && currentTest.test_results.length > 0;
  const result = hasResult ? currentTest.test_results[0] : null;

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('permissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const analyzeAnswerSheet = async () => {
    if (!selectedImage || !testId || !user?.id) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis - in real app, you would call the AI API here
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock results based on the image provided
      const mockResults = {
        rawScore: 80,
        standardScore: 131,
        percentile: 93,
        grade: 2,
      };

      await submitResultMutation.mutateAsync({
        testId,
        userId: user.id,
        rawScore: mockResults.rawScore,
        standardScore: mockResults.standardScore,
        percentile: mockResults.percentile,
        grade: mockResults.grade,
        answerSheetImageUrl: selectedImage,
      });

      setSelectedImage(null);
    } catch (error) {
      Alert.alert(t('error'), t('analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (testQuery.isLoading || !currentTest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('testDetail')}</Text>
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
        <Text style={styles.headerTitle}>{currentTest.test_name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Test Info */}
        <View style={styles.testInfoCard}>
          <Text style={styles.testTitle}>{currentTest.test_name}</Text>
          <Text style={styles.testSubject}>
            {getSubjectName(currentTest.subject)} • {currentTest.test_type.toUpperCase()}
          </Text>
          {currentTest.test_date && (
            <Text style={styles.testDate}>{formatDate(currentTest.test_date)}</Text>
          )}
        </View>

        {hasResult ? (
          /* Results Display */
          <View style={styles.resultsCard}>
            <Text style={styles.reportTitle}>성적표</Text>
            <Text style={styles.reportSubtitle}>고3 평가원 실전 2025년 3월 28일 학력평가</Text>
            
            {/* Grade Table */}
            <View style={styles.gradeTable}>
              {/* Header Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>영역</Text>
                </View>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>국어</Text>
                </View>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>수학</Text>
                </View>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>영어</Text>
                </View>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>한국사</Text>
                </View>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerText}>탐구</Text>
                </View>
              </View>

              {/* Subject Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>선택</Text>
                  <Text style={styles.labelText}>과목</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.cellText}>화법과</Text>
                  <Text style={styles.cellText}>작문</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.cellText}>미적분</Text>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.cellText}>생활과</Text>
                  <Text style={styles.cellText}>윤리</Text>
                  <Text style={styles.cellText}>세계사</Text>
                </View>
              </View>

              {/* Status Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>채점</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.completedText}>채점완</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.completedText}>채점완</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.incompleteText}>채점</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.incompleteText}>채점</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.incompleteText}>채점</Text>
                </View>
              </View>

              {/* Raw Score Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>원점수</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>80</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>86</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
              </View>

              {/* Standard Score Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>표준</Text>
                  <Text style={styles.labelText}>점수</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>131</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>137</Text>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
              </View>

              {/* Percentile Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>백분위</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>93</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>95</Text>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={styles.diagonalCell}>
                    <View style={styles.diagonalLine} />
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
              </View>

              {/* Grade Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.labelCell]}>
                  <Text style={styles.labelText}>등급</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>2</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>2</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.scoreText}>-</Text>
                </View>
              </View>
            </View>

            {result.answer_sheet_image_url && (
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>{t('answerSheet')}</Text>
                <Image 
                  source={{ uri: result.answer_sheet_image_url }} 
                  style={styles.answerSheetImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        ) : (
          /* Upload Section */
          <View style={styles.uploadCard}>
            <Text style={styles.uploadTitle}>{t('uploadAnswerSheet')}</Text>
            <Text style={styles.uploadSubtitle}>{t('uploadDescription')}</Text>

            {selectedImage ? (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.analyzeButton}
                  onPress={analyzeAnswerSheet}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <CheckCircle size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.analyzeButtonText}>
                    {isAnalyzing ? t('analyzing') : t('analyzeResults')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Camera size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>{t('takePhoto')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Upload size={24} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>{t('chooseFromLibrary')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  testInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  testTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  testSubject: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  testDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  gradeTable: {
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    padding: 8,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    backgroundColor: '#F8F9FA',
  },
  labelCell: {
    backgroundColor: '#F8F9FA',
    flex: 0.8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  completedText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  incompleteText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '500',
  },
  diagonalCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  diagonalLine: {
    position: 'absolute',
    width: '70%',
    height: 1,
    backgroundColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  imageSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  answerSheetImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButtons: {
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  selectedImageContainer: {
    alignItems: 'center',
    gap: 16,
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});