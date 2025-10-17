// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

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

export default function ExploreScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsubscribe = setInterval(() => {
      loadTransactions();
    }, 1000); // Her saniye güncelle

    loadTransactions();
    
    return () => clearInterval(unsubscribe);
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

  const getCategoryData = () => {
    const expensesByCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.category.name;
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + t.amount;
      });

    return Object.keys(expensesByCategory).map((name) => ({
      name,
      amount: expensesByCategory[name],
      color: CATEGORIES.find(c => c.name === name)?.color || '#999',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
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

  const chartData = getCategoryData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>İstatistikler</Text>
        <Text style={styles.statsSubtitle}>Finansal Özet</Text>
      </View>

      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="arrow-down-circle" size={32} color="#4CAF50" />
          <Text style={styles.summaryLabel}>Toplam Gelir</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            ₺{getTotalIncome().toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="arrow-up-circle" size={32} color="#F44336" />
          <Text style={styles.summaryLabel}>Toplam Gider</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
            ₺{getTotalExpense().toFixed(2)}
          </Text>
        </View>
      </View>

      {chartData.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Harcama Dağılımı</Text>
            <PieChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>

          <View style={styles.categoryBreakdown}>
            <Text style={styles.sectionTitle}>Kategori Detayları</Text>
            {chartData.map((item, index) => {
              const percentage = ((item.amount / getTotalExpense()) * 100).toFixed(1);
              return (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryRowLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.name}</Text>
                  </View>
                  <View style={styles.categoryRowRight}>
                    <Text style={styles.categoryPercentage}>{percentage}%</Text>
                    <Text style={styles.categoryAmount}>₺{item.amount.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color="#C0C0C0" />
          <Text style={styles.emptyText}>Henüz veri yok</Text>
          <Text style={styles.emptySubtext}>
            Ana sayfadan harcama ekleyerek başlayın
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  statsHeader: {
    padding: 20,
    paddingTop: 50,
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statsSubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  categoryBreakdown: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    color: '#666',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#999',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
    textAlign: 'center',
  },
});