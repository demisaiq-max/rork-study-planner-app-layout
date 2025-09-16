import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActionSheetIOS,
} from "react-native";
import { ChevronLeft, HelpCircle, CheckCircle, Clock, MessageSquare, ThumbsUp, X, Camera } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from "@/hooks/language-context";
import { useRouter, Stack } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/auth-context";



export default function CommunityQuestionsScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const questionsQuery = trpc.community.questions.getQuestions.useQuery({
    searchQuery: searchText || undefined,
    isSolved: selectedFilter === "solved" ? true : selectedFilter === "unsolved" ? false : undefined,
  });

  const createQuestionMutation = trpc.community.questions.createQuestion.useMutation({
    onSuccess: () => {
      questionsQuery.refetch();
      setQuestionTitle("");
      setQuestionContent("");
      setSelectedSubject("");
      setSelectedImages([]);
      setShowCreateQuestion(false);
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '질문이 등록되었습니다!' : 'Your question has been posted!'
      );
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message || (language === 'ko' ? '질문 등록에 실패했습니다.' : 'Failed to post question.')
      );
    },
  });

  const subjects = language === 'ko' 
    ? ["수학", "영어", "국어", "과학", "사회", "기타"]
    : ["Math", "English", "Korean", "Science", "Social", "Other"];

  const handleCreateQuestion = () => {
    if (!questionTitle.trim() || !questionContent.trim() || !selectedSubject) {
      Alert.alert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '모든 필드를 입력해주세요' : 'Please fill in all fields'
      );
      return;
    }

    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '질문을 등록하려면 로그인이 필요합니다.' : 'You need to login to post a question.'
      );
      return;
    }

    createQuestionMutation.mutate({
      title: questionTitle,
      content: questionContent,
      subject: selectedSubject,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
    });
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ko' ? '권한 필요' : 'Permission Required',
        language === 'ko' ? '사진을 선택하려면 갤러리 접근 권한이 필요합니다.' : 'We need gallery access permission to select photos.'
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ko' ? '권한 필요' : 'Permission Required',
        language === 'ko' ? '사진을 촬영하려면 카메라 접근 권한이 필요합니다.' : 'We need camera access permission to take photos.'
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            language === 'ko' ? '취소' : 'Cancel',
            language === 'ko' ? '사진 촬영' : 'Take Photo',
            language === 'ko' ? '갤러리에서 선택' : 'Choose from Gallery'
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        language === 'ko' ? '사진 선택' : 'Select Photo',
        language === 'ko' ? '사진을 어떻게 추가하시겠습니까?' : 'How would you like to add a photo?',
        [
          { text: language === 'ko' ? '취소' : 'Cancel', style: 'cancel' },
          { text: language === 'ko' ? '사진 촬영' : 'Take Photo', onPress: takePhoto },
          { text: language === 'ko' ? '갤러리에서 선택' : 'Choose from Gallery', onPress: pickImageFromGallery },
        ]
      );
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const questions = questionsQuery.data || [];

  const handleQuestionPress = (questionId: string) => {
    router.push({
      pathname: '/question-detail',
      params: { id: questionId }
    } as any);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: language === 'ko' ? '문제 질문하기' : 'Ask Questions',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
              <ChevronLeft size={24} color="#000000" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'ko' ? '질문 검색...' : 'Search questions...'}
            placeholderTextColor="#8E8E93"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView 
          horizontal 
          style={styles.filterContainer}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === "all" && styles.filterChipActive]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text style={[styles.filterText, selectedFilter === "all" && styles.filterTextActive]}>
              {language === 'ko' ? '전체' : 'All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === "unsolved" && styles.filterChipActive]}
            onPress={() => setSelectedFilter("unsolved")}
          >
            <Text style={[styles.filterText, selectedFilter === "unsolved" && styles.filterTextActive]}>
              {language === 'ko' ? '미해결' : 'Unsolved'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === "solved" && styles.filterChipActive]}
            onPress={() => setSelectedFilter("solved")}
          >
            <Text style={[styles.filterText, selectedFilter === "solved" && styles.filterTextActive]}>
              {language === 'ko' ? '해결됨' : 'Solved'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {questions.map((question: any) => (
            <TouchableOpacity
              key={question.id}
              style={styles.questionCard}
              activeOpacity={0.7}
              onPress={() => handleQuestionPress(question.id)}
            >
              <View style={styles.questionHeader}>
                <View style={[styles.subjectBadge, { backgroundColor: question.is_solved ? "#34C759" : "#FF9500" }]}>
                  <Text style={styles.subjectText}>{question.subject}</Text>
                </View>
                {question.is_solved && (
                  <View style={styles.solvedBadge}>
                    <CheckCircle size={14} color="#34C759" />
                    <Text style={styles.solvedText}>
                      {language === 'ko' ? '해결됨' : 'Solved'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.questionTitle}>{question.title}</Text>
              <Text style={styles.questionContent} numberOfLines={2}>
                {question.content}
              </Text>

              {question.tags && question.tags.length > 0 && (
                <View style={styles.questionTags}>
                  {question.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.questionFooter}>
                <View style={styles.questionMeta}>
                  <Clock size={12} color="#8E8E93" />
                  <Text style={styles.metaText}>
                    {new Date(question.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{question.user?.name || 'Anonymous'}</Text>
                </View>
                <View style={styles.questionStats}>
                  <View style={styles.stat}>
                    <MessageSquare size={14} color="#8E8E93" />
                    <Text style={styles.statText}>{question.answers?.length || 0}</Text>
                  </View>
                  <View style={styles.stat}>
                    <ThumbsUp size={14} color="#8E8E93" />
                    <Text style={styles.statText}>{question.likes?.length || 0}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal
          visible={showCreateQuestion}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateQuestion(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {language === 'ko' ? '새 질문' : 'New Question'}
              </Text>
              <TouchableOpacity onPress={handleCreateQuestion}>
                <Text style={styles.postButton}>
                  {language === 'ko' ? '등록' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>
                {language === 'ko' ? '과목 선택' : 'Select Subject'}
              </Text>
              <ScrollView 
                horizontal 
                style={styles.subjectSelector}
                showsHorizontalScrollIndicator={false}
              >
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectChip,
                      selectedSubject === subject && styles.subjectChipActive
                    ]}
                    onPress={() => setSelectedSubject(subject)}
                  >
                    <Text style={[
                      styles.subjectChipText,
                      selectedSubject === subject && styles.subjectChipTextActive
                    ]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>
                {language === 'ko' ? '질문 제목' : 'Question Title'}
              </Text>
              <TextInput
                style={styles.titleInput}
                placeholder={language === 'ko' ? '질문을 간단히 요약해주세요' : 'Summarize your question'}
                placeholderTextColor="#8E8E93"
                value={questionTitle}
                onChangeText={setQuestionTitle}
              />

              <Text style={styles.inputLabel}>
                {language === 'ko' ? '질문 내용' : 'Question Details'}
              </Text>
              <TextInput
                style={styles.contentInput}
                placeholder={language === 'ko' 
                  ? '질문을 자세히 설명해주세요...' 
                  : 'Describe your question in detail...'}
                placeholderTextColor="#8E8E93"
                value={questionContent}
                onChangeText={setQuestionContent}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>
                {language === 'ko' ? '이미지 (선택사항)' : 'Images (Optional)'}
              </Text>
              
              <View style={styles.imageSection}>
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={showImagePicker}
                >
                  <Camera size={24} color="#007AFF" />
                  <Text style={styles.addPhotoText}>
                    {language === 'ko' ? '사진 추가' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
                
                {selectedImages.length > 0 && (
                  <ScrollView 
                    horizontal 
                    style={styles.imagePreviewContainer}
                    showsHorizontalScrollIndicator={false}
                  >
                    {selectedImages.map((imageUri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <X size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowCreateQuestion(true)}
        >
          <HelpCircle size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  searchInput: {
    height: 36,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  solvedText: {
    fontSize: 12,
    color: "#34C759",
    fontWeight: "500",
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 12,
  },
  questionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: "#007AFF",
  },
  questionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  metaDot: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  questionStats: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    marginTop: 16,
  },
  subjectSelector: {
    flexDirection: "row",
    marginBottom: 16,
    maxHeight: 40,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    marginRight: 8,
  },
  subjectChipActive: {
    backgroundColor: "#007AFF",
  },
  subjectChipText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  subjectChipTextActive: {
    color: "#FFFFFF",
  },
  titleInput: {
    height: 44,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
  },
  contentInput: {
    minHeight: 150,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000000",
  },
  imageSection: {
    marginTop: 8,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 12,
    maxHeight: 120,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});