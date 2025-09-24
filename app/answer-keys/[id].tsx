import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ResponseItem {
  questionNumber: number;
  questionType: 'mcq' | 'text';
  correctMcqOption?: number;
  correctTextAnswers?: string[];
  pointsValue?: number;
  explanation?: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
}

export default function AnswerKeyEditor() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { data, isLoading, error } = trpc.answerKeys.getAnswerKeyById.useQuery({ id }, { enabled: !!id });
  const upsertMutation = trpc.answerKeys.upsertResponses.useMutation();

  const [rows, setRows] = useState<ResponseItem[]>([]);

  React.useEffect(() => {
    if (data) {
      const existing: ResponseItem[] = (data.answer_key_responses || []).map((r: any) => ({
        questionNumber: r.question_number,
        questionType: r.question_type,
        correctMcqOption: r.correct_mcq_option ?? undefined,
        correctTextAnswers: r.correct_text_answers ?? undefined,
        pointsValue: r.points_value ?? 1,
        explanation: r.explanation ?? undefined,
        difficultyLevel: r.difficulty_level ?? 'medium',
      }));
      if (existing.length > 0) setRows(existing);
      else if (data.total_questions) {
        const seed = Array.from({ length: data.total_questions }, (_, i) => ({ questionNumber: i + 1, questionType: i < (data.mcq_questions ?? 0) ? 'mcq' : 'text' })) as ResponseItem[];
        setRows(seed);
      }
    }
  }, [data]);

  const updateRow = useCallback((index: number, patch: Partial<ResponseItem>) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch } as ResponseItem;
      return copy;
    });
  }, []);

  const onSave = async () => {
    try {
      const payload = rows.map((r) => ({
        questionNumber: r.questionNumber,
        questionType: r.questionType,
        correctMcqOption: r.questionType === 'mcq' ? (r.correctMcqOption ?? 1) : undefined,
        correctTextAnswers: r.questionType === 'text' ? (r.correctTextAnswers ?? ['']) : undefined,
        pointsValue: r.pointsValue ?? 1,
        explanation: r.explanation ?? undefined,
        difficultyLevel: r.difficultyLevel ?? 'medium',
      }));
      await upsertMutation.mutateAsync({ answerKeyId: id, responses: payload });
      Alert.alert('Saved', 'Answer key responses saved');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save');
    }
  };

  const renderItem = useCallback(({ item, index }: { item: ResponseItem; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.qn}>#{item.questionNumber}</Text>
      <View style={styles.typeSwitch}>
        <TouchableOpacity style={[styles.chip, item.questionType === 'mcq' && styles.chipActive]} onPress={() => updateRow(index, { questionType: 'mcq' })}>
          <Text style={[styles.chipText, item.questionType === 'mcq' && styles.chipTextActive]}>MCQ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, item.questionType === 'text' && styles.chipActive]} onPress={() => updateRow(index, { questionType: 'text' })}>
          <Text style={[styles.chipText, item.questionType === 'text' && styles.chipTextActive]}>Text</Text>
        </TouchableOpacity>
      </View>
      {item.questionType === 'mcq' ? (
        <TextInput style={styles.mcqInput} keyboardType="number-pad" value={String(item.correctMcqOption ?? 1)} onChangeText={(v) => updateRow(index, { correctMcqOption: Number(v || '1') })} placeholder="Option #" />
      ) : (
        <TextInput style={styles.textInput} placeholder="Accepted answers (comma separated)" value={(item.correctTextAnswers ?? []).join(', ')} onChangeText={(v) => updateRow(index, { correctTextAnswers: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
      )}
    </View>
  ), [updateRow]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: '#B91C1C' }}>{String((error as any).message || 'Failed')}</Text></View>;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: data?.template_name || 'Answer Key', headerShown: true }} />

        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.questionNumber)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />

        <TouchableOpacity style={styles.primary} onPress={onSave} testID="save-responses">
          {upsertMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 12, paddingBottom: 100 },
  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginVertical: 6 },
  qn: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  typeSwitch: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipText: { color: '#374151' },
  chipTextActive: { color: '#1D4ED8', fontWeight: '700' },
  mcqInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  primary: { position: 'absolute', left: 16, right: 16, bottom: 20, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
