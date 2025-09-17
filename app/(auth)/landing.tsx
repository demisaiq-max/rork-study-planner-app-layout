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
            
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>프로플래너</Text>
            <Text style={styles.tagline}>
              Your ultimate study companion for academic excellence
            </Text>
          </View>
          
          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <BookOpen size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>Smart Study Planning</Text>
              <Text style={styles.featureDescription}>
                Organize your studies efficiently with AI-powered scheduling
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Clock size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>Time Management</Text>
              <Text style={styles.featureDescription}>
                Track your study sessions and optimize productivity
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <GraduationCap size={28} color="#1e40af" />
              </View>
              <Text style={styles.featureTitle}>Academic Excellence</Text>
              <Text style={styles.featureDescription}>
                Monitor your progress and achieve your academic goals
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
            <Text style={styles.getStartedButtonText}>Let&apos;s Get Started</Text>
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
    width: 160,
    height: 160,
    borderRadius: 80,
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
    width: 120,
    height: 120,
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