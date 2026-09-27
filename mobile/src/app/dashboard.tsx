import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f39c12',
  PAID: '#27ae60',
  FAILED: '#e74c3c',
  EXPIRED: '#95a5a6',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchInvoices() {
    try {
      const data = await api.listInvoices();
      setInvoices(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvoices();
  }, []);

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } }
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#fbc531" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.business}>{user?.business_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{invoices.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#27ae60' }]}>{invoices.filter(i => i.status === 'PAID').length}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#f39c12' }]}>{invoices.filter(i => i.status === 'PENDING').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Invoice list */}
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No invoices yet. Tap + to create one!</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/invoice/${item.invoice_code}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.buyerName}>{item.buyer_name}</Text>
              <Text style={styles.description} numberOfLines={1}>{item.description || 'No description'}</Text>
              <Text style={styles.code}>{item.invoice_code}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>{item.amount.toLocaleString()} {item.currency}</Text>
              <Text style={[styles.status, { backgroundColor: STATUS_COLORS[item.status] || '#95a5a6' }]}>
                {item.status}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/new-invoice')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#2c3e50' },
  greeting: { color: '#bdc3c7', fontSize: 13 },
  business: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: '#fbc531', fontWeight: 'bold' },
  statsBar: { flexDirection: 'row', backgroundColor: '#34495e', paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#bdc3c7', marginTop: 2 },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 10, marginBottom: 0, padding: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  buyerName: { fontWeight: 'bold', fontSize: 15, color: '#2c3e50' },
  description: { color: '#7f8c8d', fontSize: 13, marginTop: 2 },
  code: { color: '#bdc3c7', fontSize: 11, marginTop: 4 },
  amount: { fontWeight: 'bold', fontSize: 15, color: '#2c3e50' },
  status: { color: '#fff', fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6, overflow: 'hidden' },
  empty: { textAlign: 'center', marginTop: 80, color: '#95a5a6', fontSize: 16 },
  fab: { position: 'absolute', bottom: 28, right: 28, backgroundColor: '#fbc531', width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabText: { fontSize: 28, color: '#2c3e50', lineHeight: 32 },
});
