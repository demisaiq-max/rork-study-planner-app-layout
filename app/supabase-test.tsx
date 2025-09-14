import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function SupabaseTestScreen() {
  const supabaseTest = trpc.tests.supabaseTest.useQuery();
  const latestTestResults = trpc.tests.getLatestTestResults.useQuery('550e8400-e29b-41d4-a716-446655440000');
  const communityPosts = trpc.community.posts.getPosts.useQuery({});
  const communityGroups = trpc.community.groups.getGroups.useQuery({});
  const communityQuestions = trpc.community.questions.getQuestions.useQuery({});

  const refetchAll = () => {
    supabaseTest.refetch();
    latestTestResults.refetch();
    communityPosts.refetch();
    communityGroups.refetch();
    communityQuestions.refetch();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Database Connection Test' }} />
      
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.refreshButton} onPress={refetchAll}>
          <Text style={styles.refreshButtonText}>Refresh All Tests</Text>
        </TouchableOpacity>

        {/* Supabase Connection Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase Connection Test</Text>
          {supabaseTest.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {supabaseTest.error && (
            <Text style={styles.error}>Error: {supabaseTest.error.message}</Text>
          )}
          {supabaseTest.data && (
            <View>
              <Text style={styles.success}>
                Status: {supabaseTest.data.success ? 'Connected ✅' : 'Failed ❌'}
              </Text>
              {supabaseTest.data.success && (
                <View style={styles.tableInfo}>
                  <Text style={styles.tableTitle}>Table Counts:</Text>
                  {Object.entries(supabaseTest.data.tables).map(([table, count]) => (
                    <Text key={table} style={styles.tableRow}>
                      {table}: {count} records
                    </Text>
                  ))}
                </View>
              )}
              {supabaseTest.data.error && (
                <Text style={styles.error}>Error: {supabaseTest.data.error}</Text>
              )}
            </View>
          )}
        </View>

        {/* Test Results Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Test Results</Text>
          {latestTestResults.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {latestTestResults.error && (
            <Text style={styles.error}>Error: {latestTestResults.error.message}</Text>
          )}
          {latestTestResults.data && (
            <Text style={styles.success}>
              Found {latestTestResults.data.length} test results ✅
            </Text>
          )}
        </View>

        {/* Community Posts Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Posts</Text>
          {communityPosts.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityPosts.error && (
            <Text style={styles.error}>Error: {communityPosts.error.message}</Text>
          )}
          {communityPosts.data && (
            <Text style={styles.success}>
              Found {communityPosts.data.length} posts ✅
            </Text>
          )}
        </View>

        {/* Community Groups Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Groups</Text>
          {communityGroups.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityGroups.error && (
            <Text style={styles.error}>Error: {communityGroups.error.message}</Text>
          )}
          {communityGroups.data && (
            <Text style={styles.success}>
              Found {communityGroups.data.length} groups ✅
            </Text>
          )}
        </View>

        {/* Community Questions Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Questions</Text>
          {communityQuestions.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityQuestions.error && (
            <Text style={styles.error}>Error: {communityQuestions.error.message}</Text>
          )}
          {communityQuestions.data && (
            <Text style={styles.success}>
              Found {communityQuestions.data.length} questions ✅
            </Text>
          )}
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            User ID: 550e8400-e29b-41d4-a716-446655440000
          </Text>
          <Text style={styles.debugText}>
            Supabase URL: https://bmxtcqpuhfrvnajozzlw.supabase.co
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  loading: {
    color: '#666',
    fontStyle: 'italic',
  },
  success: {
    color: '#28a745',
    fontWeight: '500',
  },
  error: {
    color: '#dc3545',
    fontWeight: '500',
  },
  tableInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  tableTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableRow: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  debugSection: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});