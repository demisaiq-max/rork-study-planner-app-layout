import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { Plus, Edit2, Trash2, Check, X, ChevronLeft, Search, Pin, Square, CheckSquare } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useUser } from "@/hooks/user-context";

interface BrainDump {
  id: string;
  title: string;
  content: string;
  category?: string;
  is_pinned: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function BrainManagerScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch brain dumps
  const { data: brainDumps, isLoading, error, refetch } = trpc.brainDumps.getBrainDumps.useQuery(
    { limit: 100 },
    { 
      enabled: !!user?.id
    }
  );

  // Debug logging
  React.useEffect(() => {
    console.log('Brain Manager Debug:');
    console.log('- User:', user);
    console.log('- User ID:', user?.id);
    console.log('- Is Loading:', isLoading);
    console.log('- Error:', error);
    console.log('- Brain Dumps:', brainDumps?.length || 0, 'items');
    
    if (error) {
      console.error('Error fetching brain dumps:', error);
    }
    if (brainDumps) {
      console.log('Brain dumps fetched successfully:', brainDumps.length, 'items');
    }
  }, [user, isLoading, error, brainDumps]);

  // Mutations
  const createMutation = trpc.brainDumps.createBrainDump.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to create brain dump");
      console.error(error);
    },
  });

  const updateMutation = trpc.brainDumps.updateBrainDump.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update brain dump");
      console.error(error);
    },
  });

  const deleteMutation = trpc.brainDumps.deleteBrainDump.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to delete brain dump");
      console.error(error);
    },
  });

  const resetForm = () => {
    setNewItemTitle("");
    setNewItemContent("");
    setNewItemCategory("");
    setEditingTitle("");
    setEditingContent("");
    setEditingCategory("");
  };

  // Filter brain dumps
  const filteredItems = brainDumps?.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Sort brain dumps: pinned first, then by date
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Get unique categories
  const categories = Array.from(new Set(brainDumps?.map(item => item.category).filter(Boolean) || []));

  const handleEdit = (item: BrainDump) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingContent(item.content);
    setEditingCategory(item.category || "");
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim() && editingContent.trim()) {
      updateMutation.mutate({
        id: editingId,
        title: editingTitle.trim(),
        content: editingContent.trim(),
        category: editingCategory.trim() || undefined,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Brain Dump",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  const handleAddItem = () => {
    if (newItemTitle.trim() && newItemContent.trim()) {
      createMutation.mutate({
        title: newItemTitle.trim(),
        content: newItemContent.trim(),
        category: newItemCategory.trim() || undefined,
        is_pinned: false,
        is_completed: false,
      });
    } else {
      Alert.alert("Error", "Please fill in title and content");
    }
  };

  const togglePin = (item: BrainDump) => {
    updateMutation.mutate({
      id: item.id,
      is_pinned: !item.is_pinned,
    });
  };

  const toggleCompleted = (item: BrainDump) => {
    updateMutation.mutate({
      id: item.id,
      is_completed: !item.is_completed,
    });
  };

  const pinnedCount = brainDumps?.filter(item => item.is_pinned).length || 0;
  const totalCount = brainDumps?.length || 0;

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Brain Dump Manager",
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronLeft size={24} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {!user ? 'Loading user...' : 'Loading brain dumps...'}
          </Text>
          {error && (
            <Text style={styles.errorText}>Error: {error.message}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Brain Dump Manager",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
              <Plus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pinnedCount}</Text>
            <Text style={styles.statLabel}>Pinned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search brain dump items..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {categories.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            <TouchableOpacity
              style={[styles.filterButton, !selectedCategory && styles.filterButtonActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.filterButton, selectedCategory === category && styles.filterButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.filterText, selectedCategory === category && styles.filterTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? "No items found" : "No brain dump items yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? "Try adjusting your search or filters" 
                : "Tap the + button to add your first brain dump item"}
            </Text>
          </View>
        ) : (
          sortedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              {editingId === item.id ? (
                <View style={styles.editingContainer}>
                  <View style={styles.editingInputs}>
                    <TextInput
                      style={styles.editingInput}
                      value={editingTitle}
                      onChangeText={setEditingTitle}
                      placeholder="Title"
                      placeholderTextColor="#8E8E93"
                      autoFocus
                    />
                    <TextInput
                      style={[styles.editingInput, styles.editingTextArea]}
                      value={editingContent}
                      onChangeText={setEditingContent}
                      placeholder="Content"
                      placeholderTextColor="#8E8E93"
                      multiline
                      numberOfLines={3}
                    />
                    <TextInput
                      style={styles.editingInput}
                      value={editingCategory}
                      onChangeText={setEditingCategory}
                      placeholder="Category (optional)"
                      placeholderTextColor="#8E8E93"
                    />
                  </View>
                  <View style={styles.editingActions}>
                    <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
                      <Check size={20} color="#34C759" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
                      <X size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.itemContent}>
                  <TouchableOpacity
                    onPress={() => toggleCompleted(item)}
                    style={styles.checkboxContainer}
                  >
                    {item.is_completed ? (
                      <CheckSquare size={20} color="#34C759" />
                    ) : (
                      <Square size={20} color="#8E8E93" />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.itemTextContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemText, item.is_completed && styles.completedText]}>
                        {item.title}
                      </Text>
                      {item.is_pinned && <Pin size={16} color="#FF9500" />}
                    </View>
                    <Text style={[styles.itemContentText, item.is_completed && styles.completedText]} numberOfLines={2}>
                      {item.content}
                    </Text>
                    {item.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                    )}
                    <Text style={styles.itemDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => togglePin(item)}
                      style={styles.iconButton}
                    >
                      <Pin size={18} color={item.is_pinned ? "#FF9500" : "#8E8E93"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEdit(item)}
                      style={styles.iconButton}
                    >
                      <Edit2 size={18} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.title)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Brain Dump</Text>
            <TouchableOpacity onPress={handleAddItem} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              placeholder="Enter title..."
              placeholderTextColor="#8E8E93"
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={styles.textArea}
              value={newItemContent}
              onChangeText={setNewItemContent}
              placeholder="Enter your thoughts, ideas, or tasks..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={6}
            />
            
            <Text style={styles.inputLabel}>Category (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={newItemCategory}
              onChangeText={setNewItemCategory}
              placeholder="e.g., Study Plan, Ideas, Notes"
              placeholderTextColor="#8E8E93"
            />
            
            <Text style={styles.helperText}>
              Brain dumps help you capture and organize thoughts quickly.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  backButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    marginLeft: 8,
  },
  categoryFilter: {
    maxHeight: 50,
  },
  categoryFilterContent: {
    flexDirection: "row",
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 14,
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
    padding: 20,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },

  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 4,
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#8E8E93",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemContentText: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  itemDate: {
    fontSize: 12,
    color: "#8E8E93",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  editingContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  editingInputs: {
    flex: 1,
    gap: 8,
  },
  editingInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  editingTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editingActions: {
    flexDirection: "column",
    gap: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    minHeight: 150,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 12,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});