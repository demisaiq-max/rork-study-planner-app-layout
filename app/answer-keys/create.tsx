import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/auth-context';

export default function CreateAnswerKey() {
  const { isLoading: authLoading } = useAuth();
  const [templateName, setTemplateName] = useState<string>('');
  const [subject, setSubject] = useState<'korean' | 'mathematics' | 'english' | 'others'>('mathematics');
  const [testType, setTestType] = useState<'mock' | 'midterm' | 'final'>('mock');
  const [mcq, setMcq] = useState<string>('20');
  const [textQ, setTextQ] = useState<string>('0');
  const [desc, setDesc] = useState<string>('');

  const total = useMemo(() => Number(mcq || '0') + Number(textQ || '0'), [mcq, textQ]);
  const createMutation = trpc.answerKeys.createAnswerKey.useMutation();

  const onCreate = async () => {
    try {
      const res = await createMutation.mutateAsync({
        templateName: templateName.trim(),
        subject,
        testType,
        totalQuestions: total,
        mcqQuestions: Number(mcq || '0'),
        textQuestions: Number(textQ || '0'),
        description: desc.trim() || undefined,
        isActive: true,
      });
      router.replace(`/answer-keys/${res.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create');
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{ title: 'New Answer Key', headerShown: true }} />
        <Text style={styles.label}>Template Name</Text>
        <TextInput value={templateName} onChangeText={setTemplateName} placeholder="e.g. Math Mock Test A" style={styles.input} placeholderTextColor="#8E8E93" testID="template-name" />

        <Text style={styles.label}>Subject</Text>
        <View style={styles.row}>
          {(['korean','mathematics','english','others'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.chip, subject === s && styles.chipActive]} onPress={() => setSubject(s)} testID={`subject-${s}`}>
              <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Test Type</Text>
        <View style={styles.row}>
          {(['mock','midterm','final'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.chip, testType === s && styles.chipActive]} onPress={() => setTestType(s)} testID={`type-${s}`}>
              <Text style={[styles.chipText, testType === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Questions</Text>
        <View style={styles.split}>
          <View style={styles.flex1}>
            <Text style={styles.sublabel}>MCQ</Text>
            <TextInput value={mcq} onChangeText={setMcq} keyboardType="number-pad" style={styles.input} testID="mcq-count" />
          </View>
          <View style={styles.spacer} />
          <View style={styles.flex1}>
            <Text style={styles.sublabel}>Text</Text>
            <TextInput value={textQ} onChangeText={setTextQ} keyboardType="number-pad" style={styles.input} testID="text-count" />
          </View>
        </View>
        <Text style={styles.total}>Total: {total}</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput value={desc} onChangeText={setDesc} placeholder="Optional" style={[styles.input, { height: 90 }]} multiline placeholderTextColor="#8E8E93" />

        <TouchableOpacity style={styles.primary} onPress={onCreate} disabled={createMutation.isPending} testID="create-submit">
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create</Text>}
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F2F2F7' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '700', color: '#111827' },
  sublabel: { marginBottom: 6, color: '#374151' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  split: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1 },
  spacer: { width: 12 },
  total: { marginTop: 8, color: '#6B7280' },
  chip: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipText: { color: '#374151' },
  chipTextActive: { color: '#1D4ED8', fontWeight: '700' },
  primary: { backgroundColor: '#007AFF', marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '700' },
});
