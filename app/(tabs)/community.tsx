import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Heart, MessageCircle, Eye, ChevronLeft, MoreHorizontal, Send, Camera, Image as ImageIcon, X, ChevronDown, Users } from "lucide-react-native";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  user_id: string;
  group_id?: string;
  content: string;
  study_hours?: number;
  subjects_studied?: string[];
  mood?: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  group?: {
    id: string;
    name: string;
  };
  likes?: Array<{ user_id: string }>;
  comments?: Array<{
    id: string;
    content: string;
    created_at: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
}

interface Question {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject?: string;
  tags?: string[];
  image_urls?: string[];
  views_count: number;
  answers_count: number;
  likes_count: number;
  is_solved: boolean;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  likes?: Array<{ user_id: string }>;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  member_count: number;
  max_members: number;
  is_public: boolean;
  created_by: string;
  creator?: {
    id: string;
    name: string;
  };
  members?: Array<{ user_id: string }>;
  isMember?: boolean;
}

export default function CommunityScreen() {
  const { language } = useLanguage();
  const { user, isLoading: userLoading } = useUser();
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    language === 'ko' ? '오늘의 공부 인증' : "Today's Study Verification",
    language === 'ko' ? '내 등급 모임' : 'My Grade Group',
    language === 'ko' ? '문제질문하기' : 'Ask Questions'
  ];

  // Fetch posts with real-time updates
  const postsQuery = trpc.community.posts.getPosts.useQuery({
    groupId: activeTab === 1 && selectedGroup ? selectedGroup : undefined,
    limit: 50,
  }, {
    enabled: !userLoading && !!user, // Only fetch when user is loaded
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    retry: 1,
    retryDelay: 1000,
    staleTime: 5000,
  });

  // Fetch groups
  const groupsQuery = trpc.community.groups.getGroups.useQuery({
    userId: userId,
  }, {
    enabled: !userLoading && !!userId, // Only fetch when user is loaded
    retry: 1,
    retryDelay: 1000,
    staleTime: 5000,
  });

  // Fetch questions
  const questionsQuery = trpc.community.questions.getQuestions.useQuery({
    limit: 50,
  }, {
    enabled: !userLoading && !!user, // Only fetch when user is loaded
    refetchInterval: 30000,
    retry: 1,
    retryDelay: 1000,
    staleTime: 5000,
  });

  // Mutations
  const createPostMutation = trpc.community.posts.createPost.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
      setNewPostContent("");
      setShowCreatePost(false);
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '게시물이 작성되었습니다' : 'Post created successfully'
      );
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message
      );
    },
  });

  const createQuestionMutation = trpc.community.questions.createQuestion.useMutation({
    onSuccess: () => {
      questionsQuery.refetch();
      setNewQuestionTitle("");
      setNewQuestionContent("");
      setShowCreateQuestion(false);
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '질문이 등록되었습니다' : 'Question posted successfully'
      );
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message
      );
    },
  });

  const likePostMutation = trpc.community.posts.likePost.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
    },
  });

  const likeQuestionMutation = trpc.community.questions.likeQuestion.useMutation({
    onSuccess: () => {
      questionsQuery.refetch();
    },
  });

  const addCommentMutation = trpc.community.posts.addComment.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
      setNewComment("");
    },
  });

  const addAnswerMutation = trpc.community.questions.addAnswer.useMutation({
    onSuccess: () => {
      questionsQuery.refetch();
      setNewAnswer("");
    },
  });

  const joinGroupMutation = trpc.community.groups.joinGroup.useMutation({
    onSuccess: () => {
      groupsQuery.refetch();
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '그룹에 가입되었습니다' : 'Joined group successfully'
      );
    },
    onError: (error) => {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        error.message
      );
    },
  });

  const leaveGroupMutation = trpc.community.groups.leaveGroup.useMutation({
    onSuccess: () => {
      groupsQuery.refetch();
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '그룹에서 나갔습니다' : 'Left group successfully'
      );
    },
  });

  // Set up real-time subscription for posts
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'daily_posts' 
      }, () => {
        postsQuery.refetch();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'post_likes' 
      }, () => {
        postsQuery.refetch();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'post_comments' 
      }, () => {
        postsQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, postsQuery]);

  // Set up real-time subscription for questions
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('questions-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'questions' 
      }, () => {
        questionsQuery.refetch();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'answers' 
      }, () => {
        questionsQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, questionsQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      postsQuery.refetch(),
      groupsQuery.refetch(),
      questionsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleLikePost = (postId: string) => {
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }
    likePostMutation.mutate({ postId });
  };

  const handleLikeQuestion = (questionId: string) => {
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }
    likeQuestionMutation.mutate({ questionId });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }
    
    addCommentMutation.mutate({
      postId: selectedPost.id,
      content: newComment,
    });
  };

  const handleAddAnswer = () => {
    if (!newAnswer.trim() || !selectedQuestion) return;
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }
    
    addAnswerMutation.mutate({
      questionId: selectedQuestion.id,
      content: newAnswer,
    });
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '내용을 입력해주세요' : 'Please enter content'
      );
      return;
    }
    
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      groupId: selectedGroup || undefined,
    });
  };

  const handleCreateQuestion = () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      Alert.alert(
        language === 'ko' ? '알림' : 'Notice',
        language === 'ko' ? '제목과 내용을 모두 입력해주세요' : 'Please enter both title and content'
      );
      return;
    }
    
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }

    createQuestionMutation.mutate({
      title: newQuestionTitle,
      content: newQuestionContent,
    });
  };

  const handleJoinGroup = (groupId: string) => {
    if (!userId) {
      Alert.alert(
        language === 'ko' ? '로그인 필요' : 'Login Required',
        language === 'ko' ? '로그인 후 이용해주세요' : 'Please login to continue'
      );
      return;
    }
    joinGroupMutation.mutate({ groupId });
  };

  const handleLeaveGroup = (groupId: string) => {
    if (!userId) return;
    leaveGroupMutation.mutate({ groupId });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return language === 'ko' ? `${days}일 전` : `${days}d ago`;
    } else if (hours > 0) {
      return language === 'ko' ? `${hours}시간 전` : `${hours}h ago`;
    } else {
      return language === 'ko' ? '방금' : 'Just now';
    }
  };

  const renderPost = (post: Post) => {
    const isLiked = post.likes?.some(like => like.user_id === userId) || false;
    
    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.studyPostCard}
        onPress={() => {
          setSelectedPost(post);
          setShowPostDetail(true);
        }}
      >
        <View style={styles.postHeader}>
          <Image 
            source={{ uri: `https://i.pravatar.cc/150?u=${post.user_id}` }} 
            style={styles.avatar} 
          />
          <View style={styles.postInfo}>
            <Text style={styles.authorName}>
              {post.user?.name || 'Anonymous'}
              {post.group && ` • ${post.group.name}`}
            </Text>
            <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
          </View>
        </View>
        
        {post.image_url && (
          <View style={styles.studyImageContainer}>
            <Image source={{ uri: post.image_url }} style={styles.studyImage} />
          </View>
        )}
        
        {post.content && (
          <Text style={styles.studyContent}>{post.content}</Text>
        )}
        
        <View style={styles.studyActions}>
          <TouchableOpacity 
            style={styles.studyActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLikePost(post.id);
            }}
          >
            <Heart 
              size={16} 
              color={isLiked ? "#FF3B30" : "#8E8E93"} 
              fill={isLiked ? "#FF3B30" : "none"}
            />
            <Text style={[styles.studyActionText, isLiked && styles.actionTextActive]}>
              {post.likes_count}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.studyActionButton}>
            <MessageCircle size={16} color="#8E8E93" />
            <Text style={styles.studyActionText}>{post.comments_count}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.studyActionButton}>
            <Eye size={16} color="#8E8E93" />
            <Text style={styles.studyActionText}>
              {language === 'ko' ? '보기' : 'View'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuestion = (question: Question) => {
    const isLiked = question.likes?.some(like => like.user_id === userId) || false;
    
    return (
      <TouchableOpacity 
        key={question.id} 
        style={styles.discussionPostCard}
        onPress={() => {
          setSelectedQuestion(question);
          setShowQuestionDetail(true);
        }}
      >
        <View style={styles.discussionHeader}>
          <View style={styles.discussionInfo}>
            <Text style={styles.discussionTitle} numberOfLines={2}>
              {question.title}
            </Text>
            <Text style={styles.discussionContent} numberOfLines={2}>
              {question.content}
            </Text>
          </View>
          {question.image_urls && question.image_urls[0] && (
            <View style={styles.discussionImageContainer}>
              <Image source={{ uri: question.image_urls[0] }} style={styles.discussionImage} />
            </View>
          )}
        </View>
        
        <View style={styles.discussionFooter}>
          <View style={styles.discussionAuthor}>
            <Image 
              source={{ uri: `https://i.pravatar.cc/150?u=${question.user_id}` }} 
              style={styles.smallAvatar} 
            />
            <Text style={styles.discussionAuthorName}>
              {question.user?.name || 'Anonymous'}
            </Text>
            <Text style={styles.discussionTime}>{formatTime(question.created_at)}</Text>
          </View>
          
          <View style={styles.discussionActions}>
            <View style={styles.discussionActionItem}>
              <Heart size={14} color={isLiked ? "#FF3B30" : "#8E8E93"} />
              <Text style={styles.discussionActionText}>{question.likes_count}</Text>
            </View>
            <View style={styles.discussionActionItem}>
              <MessageCircle size={14} color="#8E8E93" />
              <Text style={styles.discussionActionText}>{question.answers_count}</Text>
            </View>
            <View style={styles.discussionActionItem}>
              <Eye size={14} color="#8E8E93" />
              <Text style={styles.discussionActionText}>{question.views_count}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroup = (group: Group) => {
    return (
      <TouchableOpacity 
        key={group.id} 
        style={styles.groupCard}
        onPress={() => {
          if (group.isMember) {
            setSelectedGroup(group.id);
            setShowGroupModal(false);
          } else {
            handleJoinGroup(group.id);
          }
        }}
      >
        <View style={styles.groupHeader}>
          <Users size={24} color="#007AFF" />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {group.description}
              </Text>
            )}
            <Text style={styles.groupMembers}>
              {group.member_count} / {group.max_members} {language === 'ko' ? '멤버' : 'members'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.groupButton, group.isMember && styles.groupButtonJoined]}
          onPress={(e) => {
            e.stopPropagation();
            if (group.isMember) {
              handleLeaveGroup(group.id);
            } else {
              handleJoinGroup(group.id);
            }
          }}
        >
          <Text style={[styles.groupButtonText, group.isMember && styles.groupButtonTextJoined]}>
            {group.isMember 
              ? (language === 'ko' ? '나가기' : 'Leave')
              : (language === 'ko' ? '가입하기' : 'Join')
            }
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const isLoading = userLoading || (postsQuery.isLoading && !postsQuery.data) || (groupsQuery.isLoading && !groupsQuery.data) || (questionsQuery.isLoading && !questionsQuery.data);
  const hasError = postsQuery.isError || groupsQuery.isError || questionsQuery.isError;
  
  // Log for debugging
  useEffect(() => {
    console.log('Community Screen Debug:', {
      userLoading,
      user,
      userId,
      postsLoading: postsQuery.isLoading,
      postsError: postsQuery.error,
      postsData: postsQuery.data,
      groupsLoading: groupsQuery.isLoading,
      groupsError: groupsQuery.error,
      questionsLoading: questionsQuery.isLoading,
      questionsError: questionsQuery.error,
    });
  }, [userLoading, user, postsQuery.isLoading, postsQuery.error, groupsQuery.isLoading, questionsQuery.isLoading]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{language === 'ko' ? '커뮤니티' : 'Community'}</Text>
        <TouchableOpacity>
          <Search size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text 
              style={[styles.tabText, activeTab === index && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 1 && (
        <TouchableOpacity 
          style={styles.groupSelector}
          onPress={() => setShowGroupModal(true)}
        >
          <Users size={16} color="#007AFF" />
          <Text style={styles.groupSelectorText}>
            {selectedGroup 
              ? groupsQuery.data?.find(g => g.id === selectedGroup)?.name 
              : (language === 'ko' ? '그룹 선택' : 'Select Group')
            }
          </Text>
          <ChevronDown size={16} color="#8E8E93" />
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {userLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {language === 'ko' ? '사용자 정보 로딩 중...' : 'Loading user...'}
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {language === 'ko' ? '데이터 로딩 중...' : 'Loading data...'}
            </Text>
          </View>
        ) : hasError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'ko' ? '데이터를 불러오는 중 오류가 발생했습니다' : 'Error loading data'}
            </Text>
            <Text style={styles.emptySubText}>
              {postsQuery.error?.message || groupsQuery.error?.message || questionsQuery.error?.message || 'Unknown error'}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>
                {language === 'ko' ? '다시 시도' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 0 && (
              postsQuery.data && postsQuery.data.length > 0 
                ? postsQuery.data.map(renderPost)
                : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {language === 'ko' ? '아직 게시물이 없습니다' : 'No posts yet'}
                    </Text>
                    <Text style={styles.emptySubText}>
                      {language === 'ko' ? '첫 번째 게시물을 작성해보세요!' : 'Be the first to post!'}
                    </Text>
                  </View>
                )
            )}
            {activeTab === 1 && (
              selectedGroup 
                ? (
                  postsQuery.data && postsQuery.data.filter(p => p.group_id === selectedGroup).length > 0
                    ? postsQuery.data?.filter(p => p.group_id === selectedGroup).map(renderPost)
                    : (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          {language === 'ko' ? '이 그룹에 게시물이 없습니다' : 'No posts in this group'}
                        </Text>
                      </View>
                    )
                )
                : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {language === 'ko' ? '그룹을 선택해주세요' : 'Please select a group'}
                    </Text>
                  </View>
                )
            )}
            {activeTab === 2 && (
              questionsQuery.data && questionsQuery.data.length > 0
                ? questionsQuery.data.map(renderQuestion)
                : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {language === 'ko' ? '아직 질문이 없습니다' : 'No questions yet'}
                    </Text>
                    <Text style={styles.emptySubText}>
                      {language === 'ko' ? '첫 번째 질문을 등록해보세요!' : 'Ask the first question!'}
                    </Text>
                  </View>
                )
            )}
          </>
        )}
      </ScrollView>

      {/* Group Selection Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {language === 'ko' ? '그룹 선택' : 'Select Group'}
            </Text>
            <View style={styles.spacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {groupsQuery.data?.map(renderGroup)}
          </ScrollView>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={showPostDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowPostDetail(false)}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {language === 'ko' ? '게시물' : 'Post'}
            </Text>
          </View>
          
          {selectedPost && (
            <KeyboardAvoidingView 
              style={styles.modalContent}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <ScrollView style={styles.modalScrollContent}>
                <View style={styles.postDetailHeader}>
                  <Image 
                    source={{ uri: `https://i.pravatar.cc/150?u=${selectedPost.user_id}` }} 
                    style={styles.avatar} 
                  />
                  <View style={styles.postInfo}>
                    <Text style={styles.authorName}>
                      {selectedPost.user?.name || 'Anonymous'}
                    </Text>
                    <Text style={styles.postTime}>{formatTime(selectedPost.created_at)}</Text>
                  </View>
                </View>
                
                <Text style={styles.postDetailContent}>{selectedPost.content}</Text>
                
                {selectedPost.image_url && (
                  <Image source={{ uri: selectedPost.image_url }} style={styles.postDetailImage} />
                )}
                
                <View style={styles.postDetailActions}>
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={() => handleLikePost(selectedPost.id)}
                  >
                    <Heart size={16} color="#8E8E93" />
                    <Text style={styles.likeButtonText}>{selectedPost.likes_count}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>
                    {language === 'ko' ? '댓글' : 'Comments'} {selectedPost.comments_count}
                  </Text>
                  
                  {selectedPost.comments?.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Image 
                        source={{ uri: `https://i.pravatar.cc/150?u=${comment.user?.id}` }} 
                        style={styles.commentAvatar} 
                      />
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentAuthor}>
                            {comment.user?.name || 'Anonymous'}
                          </Text>
                          <Text style={styles.commentTime}>
                            {formatTime(comment.created_at)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.content}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={language === 'ko' ? '댓글을 입력하세요...' : 'Write a comment...'}
                  placeholderTextColor="#8E8E93"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleAddComment}
                >
                  <Send size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.createPostHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.createPostTitle}>
              {language === 'ko' ? '새 게시물' : 'New Post'}
            </Text>
            <TouchableOpacity onPress={handleCreatePost}>
              <Text style={styles.postButton}>
                {language === 'ko' ? '게시' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.createPostContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TextInput
              style={styles.postTextInput}
              placeholder={language === 'ko' ? '오늘의 공부를 공유해주세요...' : 'Share your study today...'}
              placeholderTextColor="#8E8E93"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              autoFocus
            />
            
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.mediaButton}>
                <Camera size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton}>
                <ImageIcon size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create Question Modal */}
      <Modal
        visible={showCreateQuestion}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.createPostHeader}>
            <TouchableOpacity onPress={() => setShowCreateQuestion(false)}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.createPostTitle}>
              {language === 'ko' ? '새 질문' : 'New Question'}
            </Text>
            <TouchableOpacity onPress={handleCreateQuestion}>
              <Text style={styles.postButton}>
                {language === 'ko' ? '등록' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.createPostContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TextInput
              style={styles.questionTitleInput}
              placeholder={language === 'ko' ? '질문 제목' : 'Question Title'}
              placeholderTextColor="#8E8E93"
              value={newQuestionTitle}
              onChangeText={setNewQuestionTitle}
              autoFocus
            />
            <TextInput
              style={styles.postTextInput}
              placeholder={language === 'ko' ? '질문 내용을 자세히 작성해주세요...' : 'Write your question in detail...'}
              placeholderTextColor="#8E8E93"
              value={newQuestionContent}
              onChangeText={setNewQuestionContent}
              multiline
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          if (activeTab === 2) {
            setShowCreateQuestion(true);
          } else {
            setShowCreatePost(true);
          }
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    paddingBottom: 8,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  tabText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "400",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#000000",
    fontWeight: "500",
  },
  groupSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    gap: 8,
  },
  groupSelectorText: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
  },
  studyPostCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  discussionPostCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  postTime: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  studyContent: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: "500",
  },
  studyImageContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  studyImage: {
    width: width - 64,
    height: width - 64,
    backgroundColor: "#F0F0F0",
  },
  studyActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  studyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  studyActionText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  actionTextActive: {
    color: "#FF3B30",
  },
  discussionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  discussionInfo: {
    flex: 1,
  },
  discussionTitle: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  discussionContent: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  discussionImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  discussionImage: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F0F0",
  },
  discussionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discussionAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  discussionAuthorName: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
    marginRight: 8,
  },
  discussionTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  discussionActions: {
    flexDirection: "row",
    gap: 16,
  },
  discussionActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  discussionActionText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: "#007AFF",
  },
  groupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 16,
  },
  groupButtonJoined: {
    backgroundColor: "#F0F0F0",
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  groupButtonTextJoined: {
    color: "#8E8E93",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  postDetailContent: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 16,
  },
  postDetailImage: {
    width: width - 40,
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#F0F0F0",
  },
  postDetailActions: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    gap: 4,
  },
  likeButtonText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  commentsSection: {
    paddingVertical: 16,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  commentTime: {
    fontSize: 10,
    color: "#8E8E93",
  },
  commentText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  createPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  createPostContent: {
    flex: 1,
  },
  postTextInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
  },
  questionTitleInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  createPostActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 20,
  },
  mediaButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
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
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  spacer: {
    width: 24,
  },
});