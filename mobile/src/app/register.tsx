import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { saveAuth } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!businessName || !phone || !password) {
      Alert.alert('Error', 'Business name, phone, and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = await api.register({ business_name: businessName, phone, email, password });
      await saveAuth(data.token, data.user);
      router.replace('/dashboard');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 PayLink</Text>
      <Text style={styles.subtitle}>Create your seller account</Text>

      <TextInput style={styles.input} placeholder="Business name" value={businessName} onChangeText={setBusinessName} />
      <TextInput style={styles.input} placeholder="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Email (optional)" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#2c3e50" /> : <Text style={styles.buttonText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f7f6' },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#2c3e50', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#7f8c8d', marginBottom: 32 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  button: { backgroundColor: '#fbc531', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  link: { textAlign: 'center', marginTop: 20, color: '#0984e3', fontSize: 14 },
});
