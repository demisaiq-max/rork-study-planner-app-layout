import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Pause, RotateCcw, Clock, Coffee, UtensilsCrossed, History } from "lucide-react-native";
import CircularProgress from "@/components/CircularProgress";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

type TimerType = 'general' | 'tea' | 'lunch';

export default function TimerScreen() {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TimerType>('general');
  const [timeElapsed, setTimeElapsed] = useState(0); // All timers now start from 0 and count up
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { t } = useLanguage();
  const { user } = useUser();
  
  // tRPC mutations for timer operations
  const createTimerSession = trpc.timers.createTimerSession.useMutation();
  const updateTimerSession = trpc.timers.updateTimerSession.useMutation();
  const createPauseLog = trpc.timers.createPauseLog.useMutation();
  
  // Query for active timer
  const { data: activeTimer } = trpc.timers.getActiveTimer.useQuery(
    { userId: user?.id || '550e8400-e29b-41d4-a716-446655440000' },
    { 
      enabled: !!user?.id,
      refetchInterval: false,
    }
  );
  
  // Query for timer sessions history (only completed sessions)
  const { data: timerSessions, refetch: refetchSessions } = trpc.timers.getTimerSessions.useQuery(
    { 
      userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
      limit: 10,
      completedOnly: true
    },
    { enabled: !!user?.id }
  );
  
  // Load active timer on mount
  useEffect(() => {
    if (activeTimer && !currentSessionId) {
      // Resume active timer
      const startTime = new Date(activeTimer.start_time);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // All timers now show elapsed time
      if (!activeTimer.is_completed) {
        setCurrentSessionId(activeTimer.id);
        setTimeElapsed(elapsedSeconds);
        
        if (activeTimer.subject === 'general-timer') {
          setActiveTab('general');
        } else if (activeTimer.subject === 'tea-break') {
          setActiveTab('tea');
        } else if (activeTimer.subject === 'lunch-break') {
          setActiveTab('lunch');
        }
      }
    }
  }, [activeTimer, currentSessionId]);
  
  // Calculate today's total focus time from sessions (already filtered to completed only)
  const todaysTotalTime = timerSessions ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysSessions = timerSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    return todaysSessions.reduce((total, session) => total + session.duration, 0);
  })() : 0;
  
  const todaysSessionCount = timerSessions ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return timerSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    }).length;
  })() : 0;

  // Remove setCustomTime since we don't need it for stopwatch timers

  // Remove handleTimerComplete since we don't auto-complete timers anymore

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        // All timers count up from 0 (stopwatch style)
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = useCallback(async () => {
    if (!isRunning) {
      // Start timer
      if (!currentSessionId) {
        // Create new session
        try {
          const subjectMap = {
            general: 'general-timer',
            tea: 'tea-break',
            lunch: 'lunch-break'
          };
          
          const result = await createTimerSession.mutateAsync({
            userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
            subject: subjectMap[activeTab],
            duration: 0, // Will be updated when session ends
            startTime: new Date().toISOString(),
          });
          
          setCurrentSessionId(result.id);
        } catch (error) {
          console.error('Failed to create timer session:', error);
          if (Platform.OS !== 'web') {
            Alert.alert('Error', 'Failed to start timer session');
          } else {
            console.log('Error: Failed to start timer session');
          }
          return;
        }
      } else if (activeTimer?.is_paused) {
        // Resume from pause
        try {
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            isPaused: false,
          });
        } catch (error) {
          console.error('Failed to resume timer:', error);
        }
      }
    } else {
      // Pause timer
      if (currentSessionId) {
        try {
          await createPauseLog.mutateAsync({
            sessionId: currentSessionId,
            pauseTime: new Date().toISOString(),
          });
          
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            isPaused: true,
          });
        } catch (error) {
          console.error('Failed to pause timer:', error);
        }
      }
    }
    
    setIsRunning(!isRunning);
  }, [isRunning, currentSessionId, activeTab, user?.id, createTimerSession, updateTimerSession, createPauseLog, activeTimer]);

  const resetTimer = useCallback(async () => {
    // Save the session when reset (only if there's actual time spent)
    if (currentSessionId && timeElapsed > 0) {
      try {
        // Save the session with actual time spent
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: true,
          duration: timeElapsed, // Store actual elapsed time
        });
        
        // Refetch sessions to update stats
        refetchSessions();
        
        // Show save confirmation
        if (Platform.OS !== 'web') {
          Alert.alert(
            t('sessionSaved') || '세션 저장됨',
            `${Math.floor(timeElapsed / 60)}${t('minutes') || '분'} ${Math.floor(timeElapsed % 60)}${t('seconds') || '초'} ${t('sessionSavedMessage') || '세션이 저장되었습니다.'}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Failed to save timer session:', error);
      }
    } else if (currentSessionId) {
      // Cancel session if no time was spent
      try {
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: false,
        });
      } catch (error) {
        console.error('Failed to cancel timer session:', error);
      }
    }
    
    // Reset everything
    setCurrentSessionId(null);
    setIsRunning(false);
    setTimeElapsed(0);
  }, [timeElapsed, currentSessionId, updateTimerSession, refetchSessions, t]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback(() => {
    // Show a cycling progress for all timers (creates a nice visual effect)
    return (timeElapsed % 60) * (100 / 60);
  }, [timeElapsed]);

  const getTimerColor = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return "#007AFF";
      case 'tea':
        return "#34C759";
      case 'lunch':
        return "#FF9500";
      default:
        return "#007AFF";
    }
  }, [activeTab]);
  
  const getTimerTitle = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return t('generalTimer') || '일반 타이머';
      case 'tea':
        return t('teaBreak') || '차 휴식';
      case 'lunch':
        return t('lunchBreak') || '점심 휴식';
      default:
        return t('generalTimer') || '일반 타이머';
    }
  }, [activeTab, t]);
  
  const getTimerSubtitle = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return t('stayFocused') || '집중하고, 생산적으로';
      case 'tea':
        return t('enjoyYourTea') || '차 한 잔의 여유를';
      case 'lunch':
        return t('enjoyYourMeal') || '맛있는 식사 시간';
      default:
        return t('stayFocused') || '집중하고, 생산적으로';
    }
  }, [activeTab, t]);
  
  // Remove getCurrentTime since we directly use timeElapsed
  
  const handleTabChange = useCallback((tab: TimerType) => {
    if (isRunning) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          t('timerRunning') || '타이머 실행 중',
          t('stopTimerFirst') || '먼저 타이머를 정지해주세요.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    setActiveTab(tab);
    // Reset timer to 0 for all tabs
    setTimeElapsed(0);
  }, [isRunning, t]);

  return (
    <View style={[styles.container, { backgroundColor: getTimerColor() + "10" }]}>
      {/* Main Timer Content */}
      <View style={[
        styles.mainContent, 
        { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20
        }
      ]}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'general' && { backgroundColor: getTimerColor() }]}
            onPress={() => handleTabChange('general')}
          >
            <Clock size={20} color={activeTab === 'general' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabText, { color: activeTab === 'general' ? '#FFFFFF' : '#8E8E93' }]}>
              {t('generalTimer') || '일반'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tea' && { backgroundColor: getTimerColor() }]}
            onPress={() => handleTabChange('tea')}
          >
            <Coffee size={20} color={activeTab === 'tea' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabText, { color: activeTab === 'tea' ? '#FFFFFF' : '#8E8E93' }]}>
              {t('teaBreak') || '차 휴식'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lunch' && { backgroundColor: getTimerColor() }]}
            onPress={() => handleTabChange('lunch')}
          >
            <UtensilsCrossed size={20} color={activeTab === 'lunch' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabText, { color: activeTab === 'lunch' ? '#FFFFFF' : '#8E8E93' }]}>
              {t('lunchBreak') || '점심'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getTimerTitle()}</Text>
          <Text style={styles.subtitle}>{getTimerSubtitle()}</Text>
        </View>

        {/* Timer Display */}
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerContainer, { opacity: fadeAnim }]}>
            <View style={styles.progressWrapper}>
              <CircularProgress
                percentage={getProgress()}
                size={width * 0.6}
                strokeWidth={16}
                color={getTimerColor()}
              />
              <View style={styles.timerDisplay}>
                <Text style={[styles.timeText, { color: getTimerColor() }]}>
                  {formatTime(timeElapsed)}
                </Text>
                <Text style={styles.sessionText}>
                  {t('elapsedTime') || '경과 시간'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetTimer}
          >
            <RotateCcw size={24} color="#8E8E93" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: getTimerColor() }]}
            onPress={toggleTimer}
          >
            {isRunning ? (
              <Pause size={32} color="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => router.push('/timer-sessions')}
          >
            <History size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todaysSessionCount}</Text>
            <Text style={styles.statLabel}>{t('sessions') || "세션"}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(todaysTotalTime / 3600)}{t('hours') || "h"} {Math.floor((todaysTotalTime % 3600) / 60)}{t('minutes') || "m"}</Text>
            <Text style={styles.statLabel}>{t('totalFocus') || "총 집중 시간"}</Text>
          </View>
        </View>
      </View>
      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 250,
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },

  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  timerDisplay: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  sessionText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },


});