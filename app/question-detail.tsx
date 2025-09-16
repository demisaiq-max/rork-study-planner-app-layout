import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActionSheetIOS,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ChevronLeft, 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  X,
  Send,
  User,
  Image as ImageIcon,
  Heart
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function QuestionDetailScreen() {
  const { language } = useLanguage();
  const { user } = useUser();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [answerText, setAnswerText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const questionQuery = trpc.community.questions.getQuestionById.useQuery(
    { questionId: id! },
    { enabled: !!id }
  );

  const addAnswerMutation = trpc.community.questions.addAnswer.useMutation({
    onSuccess: () => {
      questionQuery.refetch();
      setAnswerText("");
      setSelectedImages([]);
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message || (language === 'ko' ? '답변 등록에 실패했습니다.' : 'Failed to post answer.')
      );
    },
  });

  const addCommentMutation = trpc.community.questions.addAnswerComment.useMutation({
    onSuccess: () => {
      questionQuery.refetch();
      setCommentingOn(null);
      setCommentText("");
      setCommentImages([]);
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message || (language === 'ko' ? '댓글 등록에 실패했습니다.' : 'Failed to post comment.')
      );
    },
  });

  const likeQuestionMutation = trpc.community.questions.likeQuestion.useMutation({
    onSuccess: () => {
      questionQuery.refetch();
    },
  });

  const likeAnswerMutation = trpc.community.questions.likeAnswer.useMutation({
    onSuccess: () => {
      questionQuery.refetch();
    },
  });

  const likeCommentMutation = trpc.community.questions.likeAnswerComment.useMutation({
    onSuccess: () => {
      questionQuery.refetch();
    },
  });

  const incrementViewMutation = trpc.community.questions.incrementView.useMutation();

  React.useEffect(() => {
    if (id && user) {
      incrementViewMutation.mutate({ questionId: id });
    }
  }, [id, user]);

  React.useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Scroll to bottom when keyboard opens
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmitAnswer = () => {
    if (!answerText.trim()) {
      Alert.alert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '답변을 입력해주세요' : 'Please enter your answer'
      );
      return;
    }

    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '답변을 등록하려면 로그인이 필요합니다.' : 'You need to login to post an answer.'
      );
      return;
    }

    addAnswerMutation.mutate({
      questionId: id!,
      content: answerText,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
    });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      Alert.alert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '댓글을 입력해주세요' : 'Please enter your comment'
      );
      return;
    }

    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '댓글을 등록하려면 로그인이 필요합니다.' : 'You need to login to post a comment.'
      );
      return;
    }

    if (!commentingOn) return;

    addCommentMutation.mutate({
      answerId: commentingOn,
      content: commentText,
      imageUrls: commentImages.length > 0 ? commentImages : undefined,
    });
  };

  const handleLikeQuestion = () => {
    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '좋아요를 누르려면 로그인이 필요합니다.' : 'You need to login to like.'
      );
      return;
    }
    likeQuestionMutation.mutate({ questionId: id! });
  };

  const handleLikeAnswer = (answerId: string) => {
    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '좋아요를 누르려면 로그인이 필요합니다.' : 'You need to login to like.'
      );
      return;
    }
    likeAnswerMutation.mutate({ answerId });
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '좋아요를 누르려면 로그인이 필요합니다.' : 'You need to login to like.'
      );
      return;
    }
    likeCommentMutation.mutate({ commentId });
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

  const addImageToAnswer = (imageUri: string) => {
    if (commentingOn) {
      setCommentImages(prev => [...prev, imageUri]);
    } else {
      setSelectedImages(prev => [...prev, imageUri]);
    }
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
      addImageToAnswer(result.assets[0].uri);
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
      addImageToAnswer(result.assets[0].uri);
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
    if (commentingOn) {
      setCommentImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleComment = (answerId: string) => {
    setCommentingOn(answerId);
    setCommentText("");
    setCommentImages([]);
    // Scroll to show the input area
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const cancelComment = () => {
    setCommentingOn(null);
    setCommentText("");
    setCommentImages([]);
  };

  if (questionQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: language === 'ko' ? '질문 상세' : 'Question Detail',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ChevronLeft size={24} color="#000000" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!questionQuery.data) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: language === 'ko' ? '질문 상세' : 'Question Detail',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ChevronLeft size={24} color="#000000" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'ko' ? '질문을 찾을 수 없습니다.' : 'Question not found.'}
          </Text>
        </View>
      </View>
    );
  }

  const question = questionQuery.data;
  const isQuestionLiked = question.likes?.some((like: any) => like.user_id === user?.id);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: language === 'ko' ? '질문 상세' : 'Question Detail',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ChevronLeft size={24} color="#000000" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
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
          <Text style={styles.questionContent}>{question.content}</Text>

          {question.image_urls && question.image_urls.length > 0 && (
            <ScrollView 
              horizontal 
              style={styles.imageContainer}
              showsHorizontalScrollIndicator={false}
            >
              {question.image_urls.map((imageUrl: string, index: number) => (
                <Image key={`question-image-${index}`} source={{ uri: imageUrl }} style={styles.questionImage} />
              ))}
            </ScrollView>
          )}

          {question.tags && question.tags.length > 0 && (
            <View style={styles.questionTags}>
              {question.tags.map((tag: string, index: number) => (
                <View key={`tag-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.questionFooter}>
            <View style={styles.questionMeta}>
              <View style={styles.userInfo}>
                {question.user?.profile_picture_url ? (
                  <Image source={{ uri: question.user.profile_picture_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={16} color="#8E8E93" />
                  </View>
                )}
                <Text style={styles.userName}>{question.user?.name || 'Anonymous'}</Text>
              </View>
              <View style={styles.timeInfo}>
                <Clock size={12} color="#8E8E93" />
                <Text style={styles.metaText}>
                  {new Date(question.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.questionActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLikeQuestion}
              >
                <ThumbsUp 
                  size={16} 
                  color={isQuestionLiked ? "#007AFF" : "#8E8E93"} 
                  fill={isQuestionLiked ? "#007AFF" : "none"}
                />
                <Text style={[styles.actionText, isQuestionLiked && styles.actionTextActive]}>
                  {question.likes?.length || 0}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <MessageSquare size={16} color="#8E8E93" />
                <Text style={styles.actionText}>{question.answers?.length || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Answers Section */}
        <View style={styles.answersSection}>
          <Text style={styles.answersTitle}>
            {language === 'ko' ? '답변' : 'Answers'} ({question.answers?.length || 0})
          </Text>
          
          {question.answers && question.answers.length > 0 ? (
            question.answers.map((answer: any) => {
              const isAnswerLiked = answer.likes?.some((like: any) => like.user_id === user?.id);
              
              return (
                <View key={answer.id} style={styles.answerCard}>
                  <View style={styles.answerHeader}>
                    <View style={styles.userInfo}>
                      {answer.user?.profile_picture_url ? (
                        <Image source={{ uri: answer.user.profile_picture_url }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <User size={16} color="#8E8E93" />
                        </View>
                      )}
                      <Text style={styles.userName}>{answer.user?.name || 'Anonymous'}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Clock size={12} color="#8E8E93" />
                      <Text style={styles.metaText}>
                        {new Date(answer.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.answerContent}>{answer.content}</Text>
                  
                  {answer.image_urls && answer.image_urls.length > 0 && (
                    <ScrollView 
                      horizontal 
                      style={styles.imageContainer}
                      showsHorizontalScrollIndicator={false}
                    >
                      {answer.image_urls.map((imageUrl: string, index: number) => (
                        <Image key={`answer-${answer.id}-image-${index}`} source={{ uri: imageUrl }} style={styles.answerImage} />
                      ))}
                    </ScrollView>
                  )}
                  
                  <View style={styles.answerActions}>
                    <TouchableOpacity 
                      style={styles.socialActionButton}
                      onPress={() => handleLikeAnswer(answer.id)}
                    >
                      <Heart 
                        size={16} 
                        color={isAnswerLiked ? "#FF3B30" : "#8E8E93"} 
                        fill={isAnswerLiked ? "#FF3B30" : "none"}
                      />
                      <Text style={[styles.socialActionText, isAnswerLiked && { color: "#FF3B30" }]}>
                        {answer.likes?.length || 0}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.socialActionButton}
                      onPress={() => handleComment(answer.id)}
                    >
                      <MessageSquare size={16} color="#8E8E93" />
                      <Text style={styles.socialActionText}>
                        {language === 'ko' ? '댓글' : 'Comment'} ({answer.comments?.length || 0})
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Comments Section */}
                  {answer.comments && answer.comments.length > 0 && (
                    <View style={styles.commentsSection}>
                      {answer.comments.map((comment: any) => {
                        const isCommentLiked = comment.likes?.some((like: any) => like.user_id === user?.id);
                        
                        return (
                          <View key={comment.id} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                              <View style={styles.userInfo}>
                                {comment.user?.profile_picture_url ? (
                                  <Image source={{ uri: comment.user.profile_picture_url }} style={styles.commentAvatar} />
                                ) : (
                                  <View style={styles.commentAvatarPlaceholder}>
                                    <User size={12} color="#8E8E93" />
                                  </View>
                                )}
                                <Text style={styles.commentUserName}>{comment.user?.name || 'Anonymous'}</Text>
                              </View>
                              <View style={styles.timeInfo}>
                                <Clock size={10} color="#8E8E93" />
                                <Text style={styles.commentMetaText}>
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </Text>
                              </View>
                            </View>
                            
                            <Text style={styles.commentContent}>{comment.content}</Text>
                            
                            {comment.image_urls && comment.image_urls.length > 0 && (
                              <ScrollView 
                                horizontal 
                                style={styles.commentImageContainer}
                                showsHorizontalScrollIndicator={false}
                              >
                                {comment.image_urls.map((imageUrl: string, index: number) => (
                                  <Image key={`comment-${comment.id}-image-${index}`} source={{ uri: imageUrl }} style={styles.commentImage} />
                                ))}
                              </ScrollView>
                            )}
                            
                            <TouchableOpacity 
                              style={styles.commentLikeButton}
                              onPress={() => handleLikeComment(comment.id)}
                            >
                              <Heart 
                                size={12} 
                                color={isCommentLiked ? "#FF3B30" : "#8E8E93"} 
                                fill={isCommentLiked ? "#FF3B30" : "none"}
                              />
                              <Text style={[styles.commentLikeText, isCommentLiked && { color: "#FF3B30" }]}>
                                {comment.likes?.length || 0}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.noAnswersContainer}>
              <Text style={styles.noAnswersText}>
                {language === 'ko' ? '아직 답변이 없습니다.' : 'No answers yet.'}
              </Text>
              <Text style={styles.noAnswersSubtext}>
                {language === 'ko' ? '첫 번째 답변을 작성해보세요!' : 'Be the first to answer!'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Answer Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.answerInputContainer, { 
          bottom: isKeyboardVisible ? 0 : insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 20
        }]}>
          <View style={styles.answerInputWrapper}>
          {commentingOn && (
            <View style={styles.commentingOnContainer}>
              <Text style={styles.commentingOnText}>
                {language === 'ko' ? '댓글 작성 중...' : 'Writing comment...'}
              </Text>
              <TouchableOpacity onPress={cancelComment}>
                <X size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Image Preview */}
          {(commentingOn ? commentImages : selectedImages).length > 0 && (
            <ScrollView 
              horizontal 
              style={styles.imagePreviewContainer}
              showsHorizontalScrollIndicator={false}
            >
              {(commentingOn ? commentImages : selectedImages).map((imageUri: string, index: number) => (
                <View key={`preview-${index}`} style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.answerInput}
              placeholder={commentingOn 
                ? (language === 'ko' ? '댓글을 입력하세요...' : 'Write a comment...') 
                : (language === 'ko' ? '답변을 입력하세요...' : 'Write your answer...')
              }
              placeholderTextColor="#8E8E93"
              value={commentingOn ? commentText : answerText}
              onChangeText={commentingOn ? setCommentText : setAnswerText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={styles.imageButton}
              onPress={showImagePicker}
            >
              <ImageIcon size={20} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, {
                opacity: (commentingOn ? commentText.trim() : answerText.trim()) ? 1 : 0.5
              }]}
              onPress={commentingOn ? handleSubmitComment : handleSubmitAnswer}
              disabled={(commentingOn ? addCommentMutation.isPending : addAnswerMutation.isPending) || !(commentingOn ? commentText.trim() : answerText.trim())}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  headerButton: {
    marginLeft: -8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    lineHeight: 24,
  },
  questionContent: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  questionImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F2F2F7",
  },
  questionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
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
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  questionActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  actionTextActive: {
    color: "#007AFF",
  },
  answersSection: {
    marginHorizontal: 16,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  answerContent: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
    marginBottom: 12,
  },
  answerImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#F2F2F7",
  },
  answerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  socialActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  socialActionText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  noAnswersContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noAnswersText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 4,
  },
  noAnswersSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  answerInputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  answerInputWrapper: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  answerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    fontSize: 14,
    color: "#000000",
    textAlignVertical: 'center',
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  replyingToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    maxHeight: 80,
    marginBottom: 8,
  },
  imagePreview: {
    position: "relative",
    marginRight: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#F2F2F7",
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  commentingOnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentingOnText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  commentCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  commentAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
  },
  commentMetaText: {
    fontSize: 10,
    color: "#8E8E93",
  },
  commentContent: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 18,
    marginBottom: 8,
  },
  commentImageContainer: {
    marginBottom: 8,
  },
  commentImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 6,
    backgroundColor: "#F2F2F7",
  },
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  commentLikeText: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
});