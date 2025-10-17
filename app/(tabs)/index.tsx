// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: Category;
  type: 'expense' | 'income';
  date: string;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'Market', icon: 'cart', color: '#FF6B6B' },
  { id: '2', name: 'Ulaşım', icon: 'car', color: '#4ECDC4' },
  { id: '3', name: 'Faturalar', icon: 'document-text', color: '#45B7D1' },
  { id: '4', name: 'Yemek', icon: 'restaurant', color: '#96CEB4' },
  { id: '5', name: 'Eğlence', icon: 'game-controller', color: '#FECA57' },
  { id: '6', name: 'Sağlık', icon: 'medical', color: '#FF9FF3' },
  { id: '7', name: 'Alışveriş', icon: 'bag', color: '#54A0FF' },
  { id: '8', name: 'Diğer', icon: 'ellipsis-horizontal', color: '#A29BFE' },
];

const INCOME_CATEGORIES: Category[] = [
  { id: '9', name: 'Maaş', icon: 'cash', color: '#00D2D3' },
  { id: '10', name: 'Freelance', icon: 'laptop', color: '#55A3FF' },
  { id: '11', name: 'Yatırım', icon: 'trending-up', color: '#5F27CD' },
  { id: '12', name: 'Diğer', icon: 'add-circle', color: '#00D2D3' },
];

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('transactions');
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const addTransaction = () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category: selectedCategory,
      type: transactionType,
      date: new Date().toISOString(),
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    // Reset form
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setModalVisible(false);
  };

  const deleteTransaction = (id: string) => {
    Alert.alert(
      'Silme Onayı',
      'Bu işlemi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            const updated = transactions.filter(t => t.id !== id);
            setTransactions(updated);
            saveTransactions(updated);
          },
        },
      ]
    );
  };

  const getTotalBalance = () => {
    return transactions.reduce((total, t) => {
      return t.type === 'income' ? total + t.amount : total - t.amount;
    }, 0);
  };

  const getTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = [...CATEGORIES, ...INCOME_CATEGORIES].find(c => c.id === item.category.id);
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onLongPress={() => deleteTransaction(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' }]}>
            <Ionicons name={category?.icon} size={24} color={category?.color} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionCategory}>{item.category.name}</Text>
            <Text style={styles.transactionDescription}>
              {item.description || 'Açıklama yok'}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? '#00D2D3' : '#FF6B6B' },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}₺{item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <Text style={styles.headerTitle}>Harcama Takip</Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
            <Text style={styles.balanceAmount}>₺{getTotalBalance().toFixed(2)}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="arrow-down-circle" size={24} color="#00D2D3" />
              <Text style={styles.statLabel}>Gelir</Text>
              <Text style={styles.statAmount}>₺{getTotalIncome().toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="arrow-up-circle" size={24} color="#FF6B6B" />
              <Text style={styles.statLabel}>Gider</Text>
              <Text style={styles.statAmount}>₺{getTotalExpense().toFixed(2)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.recentTransactions}>
          <Text style={styles.sectionTitle}>Son İşlemler</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color="#C0C0C0" />
              <Text style={styles.emptyText}>Henüz işlem yok</Text>
              <Text style={styles.emptySubtext}>+ butonuna tıklayarak başlayın</Text>
            </View>
          ) : (
            <FlatList
              data={transactions.slice(0, 10)}
              renderItem={renderTransaction}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İşlem Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => setTransactionType('expense')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Gider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => setTransactionType('income')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Gelir
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tutar (₺)"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Açıklama (opsiyonel)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.categoryTitle}>Kategori Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryList}>
                {(transactionType === 'expense' ? CATEGORIES : INCOME_CATEGORIES).map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory?.id === cat.id && styles.categoryItemActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <View
                      style={[
                        styles.categoryIconSmall,
                        { backgroundColor: cat.color + '20' },
                      ]}
                    >
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={styles.categoryItemText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addTransaction}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>Ekle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 5,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  recentTransactions: {
    padding: 20,
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C0C0C0',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeButtonActive: {
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButtonText: {
    fontSize: 16,
    color: '#999',
  },
  typeButtonTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoryList: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemActive: {
    borderColor: '#667eea',
    backgroundColor: '#F5F6FA',
  },
  categoryIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryItemText: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});