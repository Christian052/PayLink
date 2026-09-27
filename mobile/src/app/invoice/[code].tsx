import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Share, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f39c12',
  PAID: '#27ae60',
  FAILED: '#e74c3c',
  EXPIRED: '#95a5a6',
};

export default function InvoiceDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = 'http://localhost:3000';
  const payLink = `${BASE_URL}/pay/${code}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getInvoice(code);
        setInvoice(data);
      } catch (err: any) {
        Alert.alert('Error', err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function handleShare() {
    await Share.share({
      message: `Hi ${invoice?.buyer_name}, please pay invoice ${code} (${invoice?.amount?.toLocaleString()} ${invoice?.currency}) here: ${payLink}`,
      url: payLink,
    });
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#fbc531" />;
  if (!invoice) return null;

  const color = STATUS_COLORS[invoice.status] || '#95a5a6';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusText}>{invoice.status}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Invoice Code" value={code} />
        <Row label="Seller" value={invoice.business_name} />
        <Row label="Buyer" value={invoice.buyer_name} />
        <Row label="Description" value={invoice.description || '—'} />
        <Row label="Amount" value={`${invoice.amount?.toLocaleString()} ${invoice.currency}`} large />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleShare}>
        <Text style={styles.buttonText}>📤 Re-share PayLink</Text>
      </TouchableOpacity>

      <Text style={styles.payLink} numberOfLines={1}>{payLink}</Text>
    </ScrollView>
  );
}

function Row({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, large && styles.largeValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f4f7f6', flexGrow: 1 },
  statusBadge: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { color: '#7f8c8d', fontSize: 14 },
  rowValue: { color: '#2c3e50', fontSize: 14, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  largeValue: { fontSize: 18, fontWeight: 'bold' },
  button: { backgroundColor: '#fbc531', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  payLink: { textAlign: 'center', marginTop: 12, color: '#0984e3', fontSize: 12 },
});
