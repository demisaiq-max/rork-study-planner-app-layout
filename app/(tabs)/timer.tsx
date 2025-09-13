import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react-native";
import CircularProgress from "@/components/CircularProgress";
import { useStudyStore } from "@/hooks/study-store";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");

const POMODORO_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { updateStudyTime } = useStudyStore();
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
  
  // Query for timer sessions history
  const { data: timerSessions, refetch: refetchSessions } = trpc.timers.getTimerSessions.useQuery(
    { 
      userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
      limit: 10
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
      const remainingTime = activeTimer.duration - elapsedSeconds;
      
      if (remainingTime > 0 && !activeTimer.is_completed) {
        setCurrentSessionId(activeTimer.id);
        setSessionStartTime(startTime);
        setTimeLeft(remainingTime);
        
        // Determine timer mode based on subject
        if (activeTimer.subject === 'break-short') {
          setTimerMode('shortBreak');
        } else if (activeTimer.subject === 'break-long') {
          setTimerMode('longBreak');
        } else {
          setTimerMode('pomodoro');
        }
      }
    }
  }, [activeTimer, currentSessionId]);
  
  // Calculate today's total focus time from sessions
  useEffect(() => {
    if (timerSessions) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysSessions = timerSessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime() && 
               session.is_completed && 
               session.subject !== 'break-short' && 
               session.subject !== 'break-long';
      });
      
      const totalPomodoros = todaysSessions.filter(s => s.duration === POMODORO_TIME).length;
      setPomodoroCount(totalPomodoros);
    }
  }, [timerSessions]);

  const switchMode = useCallback((mode: "pomodoro" | "shortBreak" | "longBreak") => {
    setTimerMode(mode);
    setIsRunning(false);
    
    switch (mode) {
      case "pomodoro":
        setTimeLeft(POMODORO_TIME);
        break;
      case "shortBreak":
        setTimeLeft(SHORT_BREAK);
        break;
      case "longBreak":
        setTimeLeft(LONG_BREAK);
        break;
    }
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim]);

  const handleTimerComplete = useCallback(async () => {
    // Mark current session as completed
    if (currentSessionId) {
      try {
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: true,
        });
        
        // Refetch sessions to update stats
        refetchSessions();
      } catch (error) {
        console.error('Failed to complete timer session:', error);
      }
    }
    
    setCurrentSessionId(null);
    setSessionStartTime(null);
    
    if (timerMode === "pomodoro") {
      setPomodoroCount((prev) => {
        const newCount = prev + 1;
        // Auto switch to break
        if (newCount % 4 === 0) {
          switchMode("longBreak");
        } else {
          switchMode("shortBreak");
        }
        return newCount;
      });
      updateStudyTime(POMODORO_TIME / 60);
    } else {
      switchMode("pomodoro");
    }
  }, [timerMode, switchMode, updateStudyTime, currentSessionId, updateTimerSession, refetchSessions]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = useCallback(async () => {
    if (!isRunning) {
      // Start timer
      if (!currentSessionId) {
        // Create new session
        try {
          const subject = timerMode === 'pomodoro' ? 'focus' : 
                         timerMode === 'shortBreak' ? 'break-short' : 'break-long';
          const duration = timerMode === 'pomodoro' ? POMODORO_TIME :
                          timerMode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
          
          const result = await createTimerSession.mutateAsync({
            userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
            subject,
            duration,
            startTime: new Date().toISOString(),
          });
          
          setCurrentSessionId(result.id);
          setSessionStartTime(new Date());
        } catch (error) {
          console.error('Failed to create timer session:', error);
          Alert.alert('Error', 'Failed to start timer session');
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
  }, [isRunning, currentSessionId, timerMode, user?.id, createTimerSession, updateTimerSession, createPauseLog, activeTimer]);

  const resetTimer = useCallback(async () => {
    // Cancel current session if running
    if (currentSessionId && isRunning) {
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
    
    setCurrentSessionId(null);
    setSessionStartTime(null);
    setIsRunning(false);
    switchMode(timerMode);
  }, [timerMode, switchMode, currentSessionId, isRunning, updateTimerSession]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback(() => {
    const total = timerMode === "pomodoro" 
      ? POMODORO_TIME 
      : timerMode === "shortBreak" 
      ? SHORT_BREAK 
      : LONG_BREAK;
    return ((total - timeLeft) / total) * 100;
  }, [timerMode, timeLeft]);

  const getModeColor = useCallback(() => {
    switch (timerMode) {
      case "pomodoro":
        return "#007AFF";
      case "shortBreak":
        return "#34C759";
      case "longBreak":
        return "#AF52DE";
    }
  }, [timerMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getModeColor() + "10" }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('focusTimer') || "FocusFlow Timer"}</Text>
        <Text style={styles.subtitle}>{t('stayFocused') || "Stay focused, stay productive"}</Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, timerMode === "pomodoro" && styles.modeButtonActive]}
          onPress={() => switchMode("pomodoro")}
        >
          <Text style={[styles.modeText, timerMode === "pomodoro" && styles.modeTextActive]}>
            {t('pomodoro') || "Pomodoro"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, timerMode === "shortBreak" && styles.modeButtonActive]}
          onPress={() => switchMode("shortBreak")}
        >
          <Text style={[styles.modeText, timerMode === "shortBreak" && styles.modeTextActive]}>
            {t('shortBreak') || "Short Break"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, timerMode === "longBreak" && styles.modeButtonActive]}
          onPress={() => switchMode("longBreak")}
        >
          <Text style={[styles.modeText, timerMode === "longBreak" && styles.modeTextActive]}>
            {t('longBreak') || "Long Break"}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.timerContainer, { opacity: fadeAnim }]}>
        <View style={styles.progressWrapper}>
          <CircularProgress
            percentage={getProgress()}
            size={width * 0.7}
            strokeWidth={20}
            color={getModeColor()}
          />
          <View style={styles.timerDisplay}>
            <Text style={[styles.timeText, { color: getModeColor() }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.sessionText}>
              {timerMode === "pomodoro" ? (t('focusTime') || "Focus Time") : (t('breakTime') || "Break Time")}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetTimer}
        >
          <RotateCcw size={24} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: getModeColor() }]}
          onPress={toggleTimer}
        >
          {isRunning ? (
            <Pause size={32} color="#FFFFFF" />
          ) : (
            <Play size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => switchMode("shortBreak")}
        >
          <Coffee size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pomodoroCount}</Text>
          <Text style={styles.statLabel}>{t('pomodoros') || "Pomodoros"}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor((pomodoroCount * 25) / 60)}{t('hours') || "h"} {(pomodoroCount * 25) % 60}{t('minutes') || "m"}</Text>
          <Text style={styles.statLabel}>{t('totalFocus') || "Total Focus"}</Text>
        </View>
      </View>
      
      {/* Recent Sessions */}
      {timerSessions && timerSessions.length > 0 && (
        <View style={styles.recentSessions}>
          <Text style={styles.recentTitle}>Recent Sessions</Text>
          {timerSessions.slice(0, 3).map((session) => {
            const duration = Math.floor(session.duration / 60);
            const sessionDate = new Date(session.start_time);
            const isBreak = session.subject?.includes('break');
            
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionType}>
                    {isBreak ? '☕' : '🎯'} {isBreak ? 'Break' : 'Focus'}
                  </Text>
                  <Text style={styles.sessionDuration}>{duration} min</Text>
                </View>
                <Text style={styles.sessionTime}>
                  {sessionDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  modeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#007AFF",
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  modeTextActive: {
    color: "#FFFFFF",
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
    paddingBottom: 40,
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
    paddingBottom: 20,
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
  recentSessions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  sessionDuration: {
    fontSize: 14,
    color: "#8E8E93",
  },
  sessionTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
});