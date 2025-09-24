import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLanguage } from '@/hooks/language-context';

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
  const { t } = useLanguage();
  const upsertMutation = trpc.answerKeys.upsertResponses.useMutation();
  const updateMeta = trpc.answerKeys.updateAnswerKey.useMutation();

  const [rows, setRows] = useState<ResponseItem[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [testType, setTestType] = useState<'mock' | 'midterm' | 'final'>('mock');

  React.useEffect(() => {
    if (data) {
      setTemplateName(String(data.template_name ?? ''));
      const tt = (data.test_type as 'mock' | 'midterm' | 'final' | undefined) ?? 'mock';
      setTestType(tt);
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
      Alert.alert(t('success'), t('answerKeySaved') || 'Saved');
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || 'Failed to save');
    }
  };

  const onSaveMeta = async () => {
    try {
      await updateMeta.mutateAsync({ id, templateName: templateName.trim(), testType });
      Alert.alert(t('success'), t('templateUpdated') || 'Updated');
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || 'Failed to update template');
    }
  };

  const renderItem = useCallback(({ item, index }: { item: ResponseItem; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.qn}>#{item.questionNumber}</Text>
      <View style={styles.typeSwitch}>
        <TouchableOpacity style={[styles.chip, item.questionType === 'mcq' && styles.chipActive]} onPress={() => updateRow(index, { questionType: 'mcq' })}>
          <Text style={[styles.chipText, item.questionType === 'mcq' && styles.chipTextActive]}>{t('mcq')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, item.questionType === 'text' && styles.chipActive]} onPress={() => updateRow(index, { questionType: 'text' })}>
          <Text style={[styles.chipText, item.questionType === 'text' && styles.chipTextActive]}>{t('textQuestion')}</Text>
        </TouchableOpacity>
      </View>
      {item.questionType === 'mcq' ? (
        <TextInput style={styles.mcqInput} keyboardType="number-pad" value={String(item.correctMcqOption ?? 1)} onChangeText={(v) => updateRow(index, { correctMcqOption: Number(v || '1') })} placeholder="Option #" />
      ) : (
        <TextInput style={styles.textInput} placeholder="Accepted answers (comma separated)" value={(item.correctTextAnswers ?? []).join(', ')} onChangeText={(v) => updateRow(index, { correctTextAnswers: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
      )}
    </View>
  ), [updateRow, t]);

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

        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>{t('templateName')}</Text>
          <TextInput value={templateName} onChangeText={setTemplateName} style={styles.headerInput} placeholder={t('templateName')} placeholderTextColor="#9CA3AF" testID="template-name-edit" />
          <Text style={[styles.headerLabel, { marginTop: 10 }]}>{t('answerKeyTestType')}</Text>
          <View style={styles.typeSwitch}>
            {(['mock','midterm','final'] as const).map((opt) => (
              <TouchableOpacity key={opt} style={[styles.chip, testType === opt && styles.chipActive]} onPress={() => setTestType(opt)} testID={`meta-type-${opt}`}>
                <Text style={[styles.chipText, testType === opt && styles.chipTextActive]}>{t(opt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.updateBtn} onPress={onSaveMeta} testID="save-meta">
            {updateMeta.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>{t('saveTemplate') || 'Save Template'}</Text>}
          </TouchableOpacity>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.questionNumber)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />

        <TouchableOpacity style={styles.primary} onPress={onSave} testID="save-responses">
          {upsertMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t('save') || 'Save'}</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, margin: 12 },
  headerLabel: { color: '#111827', fontWeight: '700', marginBottom: 6 },
  headerInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: '#111827' },
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
  updateBtn: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  updateBtnText: { color: '#fff', fontWeight: '700' },
  primary: { position: 'absolute', left: 16, right: 16, bottom: 20, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
