import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Coffee, UtensilsCrossed, Calendar } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import { trpc } from '@/lib/trpc';

type TimerType = 'all' | 'general' | 'tea' | 'lunch';

export default function TimerSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<TimerType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Query for all timer sessions
  const { data: timerSessions, refetch } = trpc.timers.getTimerSessions.useQuery(
    { 
      limit: 100, // Get more sessions for the full view
      completedOnly: true
    },
    { enabled: !!user?.id }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getFilteredSessions = () => {
    if (!timerSessions) return [];
    
    if (selectedFilter === 'all') return timerSessions;
    
    const filterMap = {
      general: 'general-timer',
      tea: 'tea-break',
      lunch: 'lunch-break'
    };
    
    return timerSessions.filter(session => session.subject === filterMap[selectedFilter]);
  };

  const getSessionIcon = (subject: string) => {
    switch (subject) {
      case 'general-timer': return '🎯';
      case 'tea-break': return '☕';
      case 'lunch-break': return '🍽️';
      default: return '⏱️';
    }
  };
  
  const getSessionName = (subject: string) => {
    switch (subject) {
      case 'general-timer': return t('generalTimer') || '일반 타이머';
      case 'tea-break': return t('teaBreak') || '차 휴식';
      case 'lunch-break': return t('lunchBreak') || '점심 휴식';
      default: return t('timerSession') || '타이머 세션';
    }
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}${t('hours') || 'h'} ${minutes}${t('minutes') || 'm'}`;
    } else if (minutes > 0) {
      return `${minutes}${t('minutes') || 'm'} ${seconds}${t('seconds') || 's'}`;
    } else {
      return `${seconds}${t('seconds') || 's'}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('today') || '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday') || '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const groupSessionsByDate = () => {
    const filtered = getFilteredSessions();
    const grouped: { [key: string]: typeof filtered } = {};
    
    filtered.forEach(session => {
      const date = new Date(session.start_time).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    
    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const filteredSessions = getFilteredSessions();
  const totalDuration = filteredSessions.reduce((sum, session) => sum + session.duration, 0);
  const groupedSessions = groupSessionsByDate();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: t('allSessions') || '모든 세션',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('all')}
          >
            <Calendar size={16} color={selectedFilter === 'all' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
              {t('all') || '전체'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'general' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('general')}
          >
            <Clock size={16} color={selectedFilter === 'general' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.filterText, selectedFilter === 'general' && styles.activeFilterText]}>
              {t('general') || '일반'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'tea' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('tea')}
          >
            <Coffee size={16} color={selectedFilter === 'tea' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.filterText, selectedFilter === 'tea' && styles.activeFilterText]}>
              {t('tea') || '차'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'lunch' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('lunch')}
          >
            <UtensilsCrossed size={16} color={selectedFilter === 'lunch' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.filterText, selectedFilter === 'lunch' && styles.activeFilterText]}>
              {t('lunch') || '점심'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredSessions.length}</Text>
          <Text style={styles.summaryLabel}>{t('totalSessions') || '총 세션'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.floor(totalDuration / 3600)}{t('hours') || 'h'} {Math.floor((totalDuration % 3600) / 60)}{t('minutes') || 'm'}
          </Text>
          <Text style={styles.summaryLabel}>{t('totalTime') || '총 시간'}</Text>
        </View>
      </View>

      {/* Sessions List */}
      <ScrollView 
        style={styles.sessionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[styles.sessionsContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {groupedSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('noSessions') || '세션이 없습니다'}</Text>
          </View>
        ) : (
          groupedSessions.map(([dateString, sessions]) => (
            <View key={dateString} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{formatDate(dateString)}</Text>
              {sessions.map((session) => {
                const sessionDate = new Date(session.start_time);
                const endDate = session.end_time ? new Date(session.end_time) : null;
                
                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTitleRow}>
                        <Text style={styles.sessionTitle}>
                          {getSessionIcon(session.subject)} {getSessionName(session.subject)}
                        </Text>
                        <Text style={styles.sessionDuration}>
                          {formatDuration(session.duration)}
                        </Text>
                      </View>
                      <View style={styles.sessionTimeRow}>
                        <Text style={styles.sessionTime}>
                          {sessionDate.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {endDate && (
                            ` - ${endDate.toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}`
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionHeader: {
    gap: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
});