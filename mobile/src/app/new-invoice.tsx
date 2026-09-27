import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Modal, Image, Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

export default function NewInvoiceScreen() {
  const router = useRouter();

  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Result state
  const [result, setResult] = useState<{ payLink: string; qrCodeDataUrl: string; invoice_code: string } | null>(null);

  async function handleCreate() {
    if (!buyerName || !buyerPhone || !amount) {
      Alert.alert('Error', 'Buyer name, phone, and amount are required');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createInvoice({
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        description,
        amount: parsedAmount,
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert('Failed to create invoice', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!result) return;
    await Share.share({
      message: `Hi ${buyerName}, please pay your invoice of ${amount} RWF here: ${result.payLink}`,
      url: result.payLink,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!result ? (
        <>
          <Text style={styles.sectionTitle}>Buyer Details</Text>
          <TextInput style={styles.input} placeholder="Buyer full name *" value={buyerName} onChangeText={setBuyerName} />
          <TextInput style={styles.input} placeholder="Buyer phone (MoMo) *" keyboardType="phone-pad" value={buyerPhone} onChangeText={setBuyerPhone} />

          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Description (e.g. Printing services)" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          <TextInput style={styles.input} placeholder="Amount (RWF) *" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />

          <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#2c3e50" /> : <Text style={styles.buttonText}>Create Invoice & PayLink</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ Invoice Created!</Text>
          <Text style={styles.label}>Invoice Code</Text>
          <Text style={styles.code}>{result.invoice_code}</Text>

          <Text style={styles.label}>PayLink</Text>
          <Text style={styles.link}>{result.payLink}</Text>

          <Text style={styles.label}>QR Code</Text>
          {result.qrCodeDataUrl ? (
            <Image source={{ uri: result.qrCodeDataUrl }} style={styles.qr} />
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleShare}>
            <Text style={styles.buttonText}>📤 Share PayLink</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/dashboard')}>
            <Text style={styles.outlineButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f4f7f6', flexGrow: 1 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#fbc531', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  outlineButton: { borderWidth: 2, borderColor: '#2c3e50', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  outlineButtonText: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  successBox: { alignItems: 'center', paddingVertical: 20 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#27ae60', marginBottom: 24 },
  label: { fontSize: 12, color: '#7f8c8d', textTransform: 'uppercase', marginTop: 16, alignSelf: 'flex-start' },
  code: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginTop: 4 },
  link: { fontSize: 14, color: '#0984e3', marginTop: 4, alignSelf: 'flex-start' },
  qr: { width: 200, height: 200, marginTop: 8, borderRadius: 8 },
});
