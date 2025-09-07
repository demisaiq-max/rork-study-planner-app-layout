import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Upload, CheckCircle } from 'lucide-react-native';
import { useUser } from '@/hooks/user-context';
import { useLanguage } from '@/hooks/language-context';
import { trpc } from '@/lib/trpc';
import * as ImagePicker from 'expo-image-picker';
import CircularProgress from '@/components/CircularProgress';

export default function TestDetailScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { user } = useUser();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch test details
  const testQuery = trpc.tests.getSubjectTests.useQuery(
    { userId: user?.id || '', subject: '' },
    { enabled: !!user?.id }
  );

  const submitResultMutation = trpc.tests.submitTestResult.useMutation({
    onSuccess: () => {
      testQuery.refetch();
      Alert.alert(t('success'), t('testResultSubmitted'));
    },
  });

  useEffect(() => {
    if (testQuery.data !== undefined) {
      setIsLoading(false);
    }
  }, [testQuery.data]);

  const currentTest = testQuery.data?.find((test: any) => test.id === testId);
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

  if (isLoading || !currentTest) {
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
            <Text style={styles.resultsTitle}>{t('testResults')}</Text>
            
            {/* Score Summary */}
            <View style={styles.scoreSection}>
              <View style={styles.circlesContainer}>
                <View style={styles.circleItem}>
                  <CircularProgress 
                    percentage={89}
                    size={80}
                    strokeWidth={6}
                    color="#333333"
                    centerText="89"
                  />
                  <Text style={styles.circleLabel}>{t('targetPercentile')}</Text>
                </View>
                
                <View style={styles.circleItem}>
                  <CircularProgress 
                    percentage={result.percentile}
                    size={80}
                    strokeWidth={6}
                    color="#007AFF"
                    centerText={result.percentile.toString()}
                  />
                  <Text style={styles.circleLabel}>{t('yourPercentile')}</Text>
                </View>
                
                <View style={styles.circleItem}>
                  <CircularProgress 
                    percentage={68}
                    size={80}
                    strokeWidth={6}
                    color="#8E8E93"
                    centerText="68"
                  />
                  <Text style={styles.circleLabel}>{t('averagePercentile')}</Text>
                </View>
              </View>
            </View>

            {/* Detailed Scores */}
            <View style={styles.detailsSection}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{t('grade')}</Text>
                <Text style={styles.scoreValue}>{result.grade}{t('gradeUnit')}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{t('rawScore')}</Text>
                <Text style={styles.scoreValue}>{result.raw_score}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{t('standardScore')}</Text>
                <Text style={styles.scoreValue}>{result.standard_score}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{t('percentile')}</Text>
                <Text style={styles.scoreValue}>{result.percentile}%</Text>
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
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  scoreSection: {
    marginBottom: 24,
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  circleItem: {
    alignItems: 'center',
  },
  circleLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#000000',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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