import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
          <Stack.Screen name="dashboard" options={{ headerShown: true, title: 'My Invoices' }} />
          <Stack.Screen name="new-invoice" options={{ headerShown: true, title: 'New Invoice' }} />
          <Stack.Screen name="invoice/[code]" options={{ headerShown: true, title: 'Invoice Detail' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
