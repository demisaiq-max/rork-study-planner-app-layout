import { useAuth } from '@/hooks/auth-context';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';

export const SignOutButton = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      console.log('🔐 Signing out...');
      await signOut();
      console.log('🔐 Sign out successful, redirecting to auth...');
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };
  
  return (
    <TouchableOpacity style={styles.button} onPress={handleSignOut}>
      <LogOut size={14} color="#fff" />
      <Text style={styles.buttonText}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 90,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});