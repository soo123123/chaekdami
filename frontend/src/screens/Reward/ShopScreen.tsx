import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import {
  getReward,
  purchaseItem,
} from '../../api/rewardApi';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: 'PLANT' | 'FURNITURE' | 'DECORATION';
  owned?: boolean;
}

const ShopScreen = () => {
  const [currency, setCurrency] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] =
    useState<number | null>(null);

  const [items, setItems] = useState<ShopItem[]>([
    {
      id: 1,
      name: '작은 화분',
      description: '서재에 놓을 수 있는 작은 화분이에요.',
      price: 200,
      emoji: '🌱',
      category: 'PLANT',
    },
    {
      id: 2,
      name: '초록 화분',
      description: '서재를 싱그럽게 꾸며주는 화분이에요.',
      price: 300,
      emoji: '🪴',
      category: 'PLANT',
    },
    {
      id: 3,
      name: '책 더미',
      description: '독서 공간에 어울리는 책 장식이에요.',
      price: 250,
      emoji: '📚',
      category: 'DECORATION',
    },
    {
      id: 4,
      name: '독서 스탠드',
      description: '따뜻한 분위기를 만들어주는 스탠드예요.',
      price: 500,
      emoji: '💡',
      category: 'FURNITURE',
    },
    {
      id: 5,
      name: '편안한 의자',
      description: '서재에 놓을 수 있는 편안한 의자예요.',
      price: 700,
      emoji: '🪑',
      category: 'FURNITURE',
    },
    {
      id: 6,
      name: '고양이 장식',
      description: '책다듬이 서재를 꾸며주는 장식이에요.',
      price: 450,
      emoji: '🐱',
      category: 'DECORATION',
    },
  ]);

  const loadShop = async () => {
    try {
      setIsLoading(true);

      const rewardData = await getReward();

      setCurrency(
        rewardData?.currency ?? 0
      );
    } catch (error) {
      console.error(
        '보유 재화 조회 실패:',
        error
      );

      // 백엔드 연결 전 화면 테스트용
      setCurrency(1250);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, []);

  const handlePurchase = async (
    item: ShopItem
  ) => {
    if (item.owned) {
      Alert.alert(
        '구매 완료',
        '이미 보유하고 있는 아이템입니다.'
      );

      return;
    }

    if (currency < item.price) {
      Alert.alert(
        '재화 부족',
        '아이템을 구매하기 위한 재화가 부족합니다.'
      );

      return;
    }

    try {
      setPurchasingId(item.id);

      await purchaseItem(item.id);

      setCurrency(
        current => current - item.price
      );

      setItems(currentItems =>
        currentItems.map(currentItem =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                owned: true,
              }
            : currentItem
        )
      );

      Alert.alert(
        '구매 완료',
        `${item.name}을(를) 구매했습니다.`
      );
    } catch (error) {
      console.error(
        '아이템 구매 실패:',
        error
      );

      Alert.alert(
        '구매 실패',
        '아이템을 구매하지 못했습니다.'
      );
    } finally {
      setPurchasingId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          상점을 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          재화 / 상점
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 보유 재화 */}
      <View style={styles.currencyCard}>
        <View>
          <Text style={styles.currencyLabel}>
            내가 보유한 재화
          </Text>

          <Text style={styles.currencyValue}>
            🪙 {currency}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/quest')}
        >
          <Text style={styles.questLink}>
            재화 모으기 ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* 안내 영역 */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>
          🐱
        </Text>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            나만의 서재를 꾸며보세요
          </Text>

          <Text style={styles.heroDescription}>
            독서로 모은 재화를 사용해
            다양한 아이템을 구매할 수 있어요.
          </Text>
        </View>
      </View>

      {/* 상점 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          상점 아이템
        </Text>

        <Text style={styles.sectionDescription}>
          원하는 아이템을 선택해 보세요
        </Text>
      </View>

      <View style={styles.itemGrid}>
        {items.map(item => (
          <View
            key={item.id}
            style={styles.itemCard}
          >
            <View style={styles.itemImage}>
              <Text style={styles.itemEmoji}>
                {item.emoji}
              </Text>
            </View>

            <Text style={styles.itemName}>
              {item.name}
            </Text>

            <Text
              style={styles.itemDescription}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            <Text style={styles.price}>
              🪙 {item.price}
            </Text>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                item.owned &&
                  styles.ownedButton,
                currency < item.price &&
                  !item.owned &&
                  styles.disabledButton,
              ]}
              disabled={
                item.owned ||
                purchasingId === item.id
              }
              onPress={() =>
                handlePurchase(item)
              }
            >
              {purchasingId === item.id ? (
                <ActivityIndicator
                  size="small"
                />
              ) : (
                <Text
                  style={styles.purchaseButtonText}
                >
                  {item.owned
                    ? '보유 중'
                    : currency < item.price
                      ? '재화 부족'
                      : '구매'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 레벨/퀘스트 이동 */}
      <View style={styles.bottomCard}>
        <Text style={styles.bottomTitle}>
          재화가 부족한가요?
        </Text>

        <Text style={styles.bottomDescription}>
          독서 퀘스트를 달성하면
          더 많은 재화를 얻을 수 있어요.
        </Text>

        <TouchableOpacity
          style={styles.questButton}
          onPress={() => router.push('/quest')}
        >
          <Text style={styles.questButtonText}>
            퀘스트 확인하기
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ShopScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    fontSize: 34,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },

  headerSpace: {
    width: 25,
  },

  currencyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  currencyLabel: {
    fontSize: 13,
  },

  currencyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },

  questLink: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  heroCard: {
    backgroundColor: '#f2eadc',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  heroEmoji: {
    fontSize: 42,
  },

  heroContent: {
    flex: 1,
    marginLeft: 14,
  },

  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  heroDescription: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  sectionDescription: {
    fontSize: 12,
    marginTop: 3,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  itemCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
  },

  itemImage: {
    height: 90,
    backgroundColor: '#f4f0e8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  itemEmoji: {
    fontSize: 42,
  },

  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  itemDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    minHeight: 32,
  },

  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },

  purchaseButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 9,
    marginTop: 10,
    alignItems: 'center',
  },

  ownedButton: {
    backgroundColor: '#a9b9aa',
  },

  disabledButton: {
    backgroundColor: '#cccccc',
  },

  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  bottomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },

  bottomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  bottomDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  questButton: {
    backgroundColor: '#4f7658',
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 15,
  },

  questButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
