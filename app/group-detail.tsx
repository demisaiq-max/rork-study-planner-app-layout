import React, { useState, useEffect, useRef } from "react";
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
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Heart, MessageCircle, Eye, ChevronLeft, Send, Camera, Image as ImageIcon, X, Users, UserPlus } from "lucide-react-native";
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
  views_count: number;
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
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user?: {
      id: string;
      name: string;
    };
  }[];
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

export default function GroupDetailScreen() {
  const { language } = useLanguage();
  const { user, isLoading: userLoading } = useUser();
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  // Fetch group details
  const groupQuery = trpc.community.groups.getGroups.useQuery({
    userId: userId,
  }, {
    enabled: !userLoading && !!userId && !!groupId,
  });

  const currentGroup = groupQuery.data?.find(g => g.id === groupId);

  // Fetch posts for this group
  const postsQuery = trpc.community.posts.getPosts.useQuery({
    groupId: groupId,
    limit: 50,
  }, {
    enabled: !userLoading && !!user && !!groupId,
    refetchInterval: 10000,
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

  const likePostMutation = trpc.community.posts.likePost.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
    },
  });

  const addCommentMutation = trpc.community.posts.addComment.useMutation({
    onSuccess: () => {
      postsQuery.refetch().then(() => {
        if (selectedPost) {
          const updatedPost = postsQuery.data?.find(p => p.id === selectedPost.id);
          if (updatedPost) {
            setSelectedPost(updatedPost);
          }
        }
      });
      setNewComment("");
    },
  });

  const incrementPostViewMutation = trpc.community.posts.incrementView.useMutation();

  const joinGroupMutation = trpc.community.groups.joinGroup.useMutation({
    onSuccess: () => {
      groupQuery.refetch();
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '그룹에 가입되었습니다' : 'Joined group successfully'
      );
    },
  });

  const leaveGroupMutation = trpc.community.groups.leaveGroup.useMutation({
    onSuccess: () => {
      groupQuery.refetch();
      Alert.alert(
        language === 'ko' ? '성공' : 'Success',
        language === 'ko' ? '그룹에서 나갔습니다' : 'Left group successfully'
      );
      router.back();
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !groupId) return;
    
    const channel = supabase
      .channel(`group-${groupId}-changes`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'daily_posts',
        filter: `group_id=eq.${groupId}`
      }, () => {
        postsQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId, postsQuery]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      postsQuery.refetch(),
      groupQuery.refetch(),
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
      groupId: groupId,
    });
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
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: `https://i.pravatar.cc/150?u=${post.user_id}` }} 
              style={styles.avatar} 
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {post.user?.name || '익명'}
              </Text>
              <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => {
            setSelectedPost(post);
            setShowPostDetail(true);
            incrementPostViewMutation.mutate({ postId: post.id });
          }}
        >
          <Image 
            source={{ 
              uri: post.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop'
            }} 
            style={styles.postImage} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.contentSection}
          onPress={() => {
            setSelectedPost(post);
            setShowPostDetail(true);
            incrementPostViewMutation.mutate({ postId: post.id });
          }}
        >
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.actionsBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikePost(post.id)}
            disabled={likePostMutation.isPending}
          >
            <Heart 
              size={18} 
              color={isLiked ? "#FF3B30" : "#8E8E93"} 
              fill={isLiked ? "#FF3B30" : "none"}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedPost(post);
              setShowPostDetail(true);
              incrementPostViewMutation.mutate({ postId: post.id });
            }}
          >
            <MessageCircle size={18} color="#8E8E93" />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </TouchableOpacity>
          
          <View style={styles.actionButton}>
            <Eye size={18} color="#8E8E93" />
            <Text style={styles.actionText}>{post.views_count || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  const isLoading = userLoading || groupQuery.isLoading || postsQuery.isLoading;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: currentGroup?.name || (language === 'ko' ? '그룹' : 'Group'),
          headerRight: () => currentGroup && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                if (currentGroup.isMember) {
                  Alert.alert(
                    language === 'ko' ? '그룹 나가기' : 'Leave Group',
                    language === 'ko' ? '정말 이 그룹을 나가시겠습니까?' : 'Are you sure you want to leave this group?',
                    [
                      {
                        text: language === 'ko' ? '취소' : 'Cancel',
                        style: 'cancel'
                      },
                      {
                        text: language === 'ko' ? '나가기' : 'Leave',
                        style: 'destructive',
                        onPress: () => leaveGroupMutation.mutate({ groupId })
                      }
                    ]
                  );
                } else {
                  joinGroupMutation.mutate({ groupId });
                }
              }}
            >
              {currentGroup.isMember ? (
                <Text style={styles.headerButtonText}>
                  {language === 'ko' ? '나가기' : 'Leave'}
                </Text>
              ) : (
                <UserPlus size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {currentGroup && (
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Users size={20} color="#007AFF" />
            <Text style={styles.groupName}>{currentGroup.name}</Text>
          </View>
          {currentGroup.description && (
            <Text style={styles.groupDescription}>{currentGroup.description}</Text>
          )}
          <Text style={styles.groupMembers}>
            {currentGroup.member_count} / {currentGroup.max_members} {language === 'ko' ? '멤버' : 'members'}
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {language === 'ko' ? '로딩 중...' : 'Loading...'}
            </Text>
          </View>
        ) : postsQuery.data && postsQuery.data.length > 0 ? (
          postsQuery.data.map(renderPost)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'ko' ? '아직 게시물이 없습니다' : 'No posts yet'}
            </Text>
            <Text style={styles.emptySubText}>
              {language === 'ko' ? '첫 번째 게시물을 작성해보세요!' : 'Be the first to post!'}
            </Text>
          </View>
        )}
      </ScrollView>

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
            <View style={styles.spacer} />
          </View>
          
          {selectedPost && (
            <KeyboardAvoidingView 
              style={styles.modalContent}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <ScrollView 
                ref={scrollViewRef}
                style={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 80 }}
              >
                <View style={styles.postDetailHeader}>
                  <Image 
                    source={{ uri: `https://i.pravatar.cc/150?u=${selectedPost.user_id}` }} 
                    style={styles.detailAvatar} 
                  />
                  <View style={styles.postInfo}>
                    <Text style={styles.authorName}>
                      {selectedPost.user?.name || 'Anonymous'}
                    </Text>
                    <Text style={styles.detailPostTime}>{formatTime(selectedPost.created_at)}</Text>
                  </View>
                </View>
                
                <Text style={styles.postDetailContent}>{selectedPost.content}</Text>
                
                <Image 
                  source={{ 
                    uri: selectedPost.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop'
                  }} 
                  style={styles.postDetailImage} 
                />
                
                <View style={styles.postDetailActions}>
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={() => handleLikePost(selectedPost.id)}
                    disabled={likePostMutation.isPending}
                  >
                    <Heart 
                      size={16} 
                      color={selectedPost.likes?.some(like => like.user_id === userId) ? "#FF3B30" : "#8E8E93"}
                      fill={selectedPost.likes?.some(like => like.user_id === userId) ? "#FF3B30" : "none"}
                    />
                    <Text style={[styles.likeButtonText, selectedPost.likes?.some(like => like.user_id === userId) && { color: "#FF3B30" }]}>
                      {selectedPost.likes_count || 0}
                    </Text>
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
              
              <View style={[
                styles.commentInputContainer,
                { bottom: keyboardHeight > 0 ? 0 : 0 }
              ]}>
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder={language === 'ko' ? '댓글을 입력하세요...' : 'Write a comment...'}
                    placeholderTextColor="#8E8E93"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, (!newComment.trim() || addCommentMutation.isPending) && styles.sendButtonDisabled]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Send size={20} color={newComment.trim() ? "#007AFF" : "#C7C7CC"} />
                    )}
                  </TouchableOpacity>
                </View>
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
              placeholder={language === 'ko' ? '그룹에 공유할 내용을 작성해주세요...' : 'Share with the group...'}
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

      {/* Floating Action Button */}
      {currentGroup?.isMember && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowCreatePost(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
  },
  groupInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  groupDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    lineHeight: 20,
  },
  groupMembers: {
    fontSize: 12,
    color: "#007AFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: "#8E8E93",
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: "#F0F0F0",
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postContent: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  actionsBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  actionTextActive: {
    color: "#FF3B30",
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
  spacer: {
    width: 24,
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
  detailAvatar: {
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
  detailPostTime: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 14,
    color: '#000000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
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
    bottom: 20,
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
});