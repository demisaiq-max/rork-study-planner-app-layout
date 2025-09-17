import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Clock, GraduationCap } from 'lucide-react-native';

export default function LandingScreen() {
  const handleGetStarted = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/kx8en0sq0cs0zgj0ikqzt' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.welcomeText}>환영합니다</Text>
            <Text style={styles.appName}>프로플래너</Text>
            <Text style={styles.tagline}>
              학업 성취를 위한 최고의 학습 동반자
            </Text>
          </View>
          
          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <BookOpen size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>스마트 학습 계획</Text>
              <Text style={styles.featureDescription}>
                체계적인 스케줄링으로 효율적인 학습 관리
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Clock size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>시간 관리</Text>
              <Text style={styles.featureDescription}>
                학습 세션을 추적하고 생산성을 최적화
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <GraduationCap size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>학업 성취</Text>
              <Text style={styles.featureDescription}>
                진도를 모니터링하고 학업 목표를 달성하세요
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 50,
  },
  logoContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logo: {
    width: 180,
    height: 180,
  },
  welcomeText: {
    fontSize: 18,
    color: '#bfdbfe',
    marginBottom: 8,
    fontWeight: '400',
    textAlign: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#93c5fd',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  featuresContainer: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#3b82f6',
  },
  getStartedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});