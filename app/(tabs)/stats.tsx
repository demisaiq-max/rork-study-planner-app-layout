import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrendingUp, Award, Target, Clock } from "lucide-react-native";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";



export default function StatsScreen() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [monthlyGoal] = useState(150); // Keep monthly goal as 150h as requested
  
  // Get timer sessions data
  const timerSessionsQuery = trpc.timers.getTimerSessions.useQuery(
    {
      userId: user?.id || '',
      limit: 1000,
      completedOnly: true,
    },
    {
      enabled: !!user?.id,
      refetchInterval: 30000, // Refetch every 30 seconds for live data
    }
  );

  // Calculate statistics from timer sessions
  const stats = useMemo(() => {
    if (!timerSessionsQuery.data) {
      return {
        todayHours: 0,
        todayMinutes: 0,
        weeklyHours: 0,
        dayStreak: 0,
        weekData: [],
        timeDistribution: [],
      };
    }

    const getActivityColor = (activity: string): string => {
      const colors = {
        'general-timer': '#007AFF',
        'lunch-break': '#FF9500', 
        'tea-break': '#34C759',
        'focus-timer': '#AF52DE',
        'pomodoro': '#FF3B30',
        'short-break': '#00C7BE',
        'long-break': '#8E8E93'
      };
      return colors[activity as keyof typeof colors] || '#007AFF';
    };

    const sessions = timerSessionsQuery.data;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    // Calculate today's study time
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= today && sessionDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    
    const todayTotalMinutes = todaySessions.reduce((total, session) => {
      return total + (session.duration || 0) / 60;
    }, 0);
    
    const todayHours = Math.floor(todayTotalMinutes / 60);
    const todayMinutes = Math.floor(todayTotalMinutes % 60);

    // Calculate weekly study time
    const weeklySessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= weekStart;
    });
    
    const weeklyTotalMinutes = weeklySessions.reduce((total, session) => {
      return total + (session.duration || 0) / 60;
    }, 0);
    
    const weeklyHours = Math.floor(weeklyTotalMinutes / 60);

    // Calculate day streak
    const uniqueDays = new Set();
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_time);
      const dayKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}-${sessionDate.getDate()}`;
      uniqueDays.add(dayKey);
    });
    
    let dayStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      const dayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (uniqueDays.has(dayKey)) {
        dayStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate week data for chart
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = weekDays.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const dayEnd = new Date(dayDate.getTime() + 24 * 60 * 60 * 1000);
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= dayDate && sessionDate < dayEnd;
      });
      
      const dayMinutes = daySessions.reduce((total, session) => {
        return total + (session.duration || 0) / 60;
      }, 0);
      
      return {
        day,
        hours: dayMinutes / 60,
      };
    });

    // Calculate time distribution by activity type
    const activityMap = new Map<string, number>();
    sessions.forEach(session => {
      // Determine activity type based on subject or default to general-timer
      let activity = 'general-timer';
      if (session.subject) {
        const subject = session.subject.toLowerCase();
        if (subject.includes('lunch') || subject.includes('점심')) {
          activity = 'lunch-break';
        } else if (subject.includes('tea') || subject.includes('차') || subject.includes('휴식')) {
          activity = 'tea-break';
        } else if (subject.includes('focus') || subject.includes('집중')) {
          activity = 'focus-timer';
        } else if (subject.includes('pomodoro') || subject.includes('뽀모도로')) {
          activity = 'pomodoro';
        } else if (subject.includes('short') || subject.includes('짧은')) {
          activity = 'short-break';
        } else if (subject.includes('long') || subject.includes('긴')) {
          activity = 'long-break';
        }
      }
      
      const minutes = (session.duration || 0) / 60;
      activityMap.set(activity, (activityMap.get(activity) || 0) + minutes);
    });
    
    const totalMinutes = Array.from(activityMap.values()).reduce((sum, minutes) => sum + minutes, 0);
    const timeDistribution = Array.from(activityMap.entries())
      .map(([activity, minutes]) => ({
        name: getActivityDisplayName(activity),
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        color: getActivityColor(activity),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4); // Top 4 activities

    function getActivityDisplayName(activity: string): string {
      const activityNames = {
        'general-timer': t('generalTimer'),
        'lunch-break': t('lunchBreak'),
        'tea-break': t('teaBreak'),
        'focus-timer': t('focusTimer'),
        'pomodoro': t('pomodoro'),
        'short-break': t('shortBreak'),
        'long-break': t('longBreak')
      };
      return activityNames[activity as keyof typeof activityNames] || activity;
    }

    return {
      todayHours,
      todayMinutes,
      weeklyHours,
      dayStreak,
      weekData,
      timeDistribution,
    };
  }, [timerSessionsQuery.data, t]);

  const maxHours = Math.max(...stats.weekData.map(d => d.hours), 1);
  const insets = useSafeAreaInsets();

  if (timerSessionsQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('stats')}</Text>
          <Text style={styles.subtitle}>{t('progress')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Clock size={24} color="#FFFFFF" />
            <Text style={styles.statValueLight}>{stats.todayHours}{t('hours')} {stats.todayMinutes}{t('minutes')}</Text>
            <Text style={styles.statLabelLight}>{t('todayStudy')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#34C759" />
            <Text style={styles.statValue}>{stats.weeklyHours}{t('hours')}</Text>
            <Text style={styles.statLabel}>{t('thisWeek')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Target size={24} color="#FF9500" />
            <Text style={styles.statValue}>{monthlyGoal}{t('hours')}</Text>
            <Text style={styles.statLabel}>{t('monthlyGoal')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Award size={24} color="#AF52DE" />
            <Text style={styles.statValue}>{stats.dayStreak}</Text>
            <Text style={styles.statLabel}>{t('dayStreak')}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('weeklyOverview')}</Text>
          <View style={styles.chart}>
            {stats.weekData.map((data, index) => (
              <View key={`week-${data.day}-${index}`} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: `${(data.hours / maxHours) * 100}%`,
                        backgroundColor: index === 6 ? "#007AFF" : "#E5E5EA",
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{data.day}</Text>
                <Text style={styles.barValue}>{data.hours.toFixed(1)}{t('hours')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.subjectsContainer}>
          <Text style={styles.sectionTitle}>{t('timeDistribution')}</Text>
          <View style={styles.subjectsList}>
            {stats.timeDistribution.length > 0 ? (
              stats.timeDistribution.map((activity, index) => (
                <View key={`activity-${activity.name}-${index}`} style={styles.subjectItem}>
                  <View style={styles.subjectInfo}>
                    <View style={[styles.subjectDot, { backgroundColor: activity.color }]} />
                    <Text style={styles.subjectName}>{activity.name}</Text>
                    <Text style={styles.subjectPercentage}>{activity.percentage}%</Text>
                  </View>
                  <View style={styles.subjectBar}>
                    <View 
                      style={[
                        styles.subjectProgress, 
                        { width: `${activity.percentage}%`, backgroundColor: activity.color }
                      ]} 
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('noStudyDataYet')}</Text>
                <Text style={styles.emptyStateSubtext}>{t('startStudyingToSeeStats')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>{t('recentAchievements')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {[
              { 
                icon: "🔥", 
                title: `${stats.dayStreak}${t('dayStreakAchievement')}`, 
                date: stats.dayStreak > 0 ? t('current') : t('notStarted')
              },
              { 
                icon: "⭐", 
                title: `${stats.weeklyHours}${t('hoursThisWeek')}`, 
                date: t('thisWeek')
              },
              { 
                icon: "🎯", 
                title: `${Math.round((stats.weeklyHours / monthlyGoal) * 100)}% ${t('monthlyProgress')}`, 
                date: t('monthlyGoal')
              },
              { 
                icon: "📚", 
                title: `${stats.todayHours + stats.todayMinutes / 60}${t('hoursToday')}`, 
                date: t('today')
              },
            ].map((achievement, index) => (
              <View key={`achievement-${achievement.icon}-${index}`} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPrimary: {
    backgroundColor: "#007AFF",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 8,
  },
  statValueLight: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  statLabelLight: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 4,
    opacity: 0.9,
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    height: 120,
    width: 30,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#8E8E93",
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "600",
    marginTop: 2,
  },
  subjectsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  subjectsList: {
    gap: 16,
  },
  subjectItem: {
    gap: 8,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
  },
  subjectPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  subjectBar: {
    height: 6,
    backgroundColor: "#F2F2F7",
    borderRadius: 3,
    overflow: "hidden",
  },
  subjectProgress: {
    height: "100%",
    borderRadius: 3,
  },
  achievementsContainer: {
    marginTop: 20,
    paddingLeft: 20,
  },
  achievementsScroll: {
    paddingRight: 20,
  },
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    width: 140,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 11,
    color: "#8E8E93",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
});