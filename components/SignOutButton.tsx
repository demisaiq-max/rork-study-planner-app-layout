import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      console.log('🔐 Signing out...');
      await signOut();
      console.log('🔐 Sign out successful, redirecting to auth...');
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error('Sign out error:', JSON.stringify(err, null, 2));
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
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});