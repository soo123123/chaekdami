
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  getRewardStatus,
  purchaseItem,
} from '../../api/rewardApi';

type Category = 'ALL' | 'PLANT' | 'FURNITURE' | 'DECORATION';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: Exclude<Category, 'ALL'>;
  owned?: boolean;
}

const initialItems: ShopItem[] = [
  {
    id: 1,
    name: '작은 화분',
    description: '서재를 꾸밀 수 있는 작은 화분',
    price: 100,
    emoji: '🪴',
    category: 'PLANT',
  },
  {
    id: 2,
    name: '책 더미',
    description: '책이 쌓여 있는 장식 아이템',
    price: 150,
    emoji: '📚',
    category: 'DECORATION',
  },
  {
    id: 3,
    name: '독서 스탠드',
    description: '따뜻한 분위기의 독서 스탠드',
    price: 250,
    emoji: '💡',
    category: 'FURNITURE',
  },
  {
    id: 4,
    name: '독서 의자',
    description: '편안한 독서용 의자',
    price: 400,
    emoji: '🪑',
    category: 'FURNITURE',
  },
  {
    id: 5,
    name: '고양이 장식',
    description: '서재에 놓을 수 있는 고양이 장식',
    price: 500,
    emoji: '🐱',
    category: 'DECORATION',
  },
];

const categories: { key: Category; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'PLANT', label: '식물' },
  { key: 'FURNITURE', label: '가구' },
  { key: 'DECORATION', label: '장식' },
];

export default function ShopScreen() {
  const { width } = useWindowDimensions();

  const [currency, setCurrency] = useState(0);
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState<Category>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isTestData, setIsTestData] = useState(false);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

  useEffect(() => {
    const loadReward = async () => {
      try {
        const data = await getRewardStatus();
        setCurrency(Number(data?.currency) || 0);
        setIsTestData(false);
      } catch (error) {
        console.warn('재화 정보 조회 실패:', error);
        setCurrency(1250);
        setIsTestData(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadReward();
  }, []);

  const filteredItems = items.filter(
    item => category === 'ALL' || item.category === category
  );

  const itemWidth =
    Math.min(width, 800) <= 400 ? '100%' : '48%';

  const executePurchase = async (item: ShopItem) => {
    if (purchasingId !== null) return;

    setPurchasingId(item.id);

    try {
      await purchaseItem(item.id);

      setCurrency(current => current - item.price);

      setItems(current =>
        current.map(existing =>
          existing.id === item.id
            ? { ...existing, owned: true }
            : existing
        )
      );

      Alert.alert('구매 완료', `${item.name}을(를) 구매했습니다.`);
    } catch (error) {
      console.warn('아이템 구매 실패:', error);
      Alert.alert(
        '구매 실패',
        '서버 연결 또는 구매 API를 확인해주세요.'
      );
    } finally {
      setPurchasingId(null);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    if (item.owned || purchasingId !== null) return;

    if (isTestData) {
      Alert.alert(
        '테스트 화면',
        '현재 서버가 연결되지 않아 실제 아이템 구매는 할 수 없습니다.'
      );
      return;
    }

    if (currency < item.price) {
      Alert.alert('재화 부족', '보유 재화가 부족합니다.');
      return;
    }

    // 웹에서는 React Native Alert 확인 버튼이
    // 정상 표시되지 않을 수 있으므로 별도 처리
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `${item.name}을(를) ${item.price} 재화로 구매하시겠습니까?`
      );

      if (confirmed) {
        void executePurchase(item);
      }

      return;
    }

    Alert.alert(
      '아이템 구매',
      `${item.name}을(를) ${item.price} 재화로 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: () => {
            void executePurchase(item);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5E7D61" />
        <Text style={styles.loadingText}>
          상점 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backArea}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>상점</Text>
        <View style={styles.backArea} />
      </View>

      {isTestData && (
        <Text style={styles.testNotice}>
          현재 서버 연결 전 테스트 데이터를 표시하고 있어요.
        </Text>
      )}

      <View style={styles.currencyCard}>
        <View>
          <Text style={styles.currencyLabel}>나의 보유 재화</Text>
          <Text style={styles.currencyValue}>
            🪙 {currency.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/reward/quest')}
        >
          <Text style={styles.currencyLink}>재화 얻기 ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guideCard}>
        <View style={styles.guideIcon}>
          <Text style={styles.guideEmoji}>🛍️</Text>
        </View>

        <View style={styles.guideInfo}>
          <Text style={styles.guideTitle}>
            나만의 서재를 꾸며보세요
          </Text>
          <Text style={styles.guideDescription}>
            독서 활동으로 모은 재화를 사용해
            다양한 아이템을 구매할 수 있어요.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>아이템 상점</Text>
        <Text style={styles.itemCount}>
          총 {filteredItems.length}개
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.categoryButton,
              category === option.key && styles.categoryActive,
            ]}
            onPress={() => setCategory(option.key)}
          >
            <Text
              style={[
                styles.categoryText,
                category === option.key && styles.categoryTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.itemGrid}>
        {filteredItems.map(item => {
          const isPurchasing = purchasingId === item.id;
          const isOwned = Boolean(item.owned);
          const insufficient = currency < item.price;

          return (
            <View
              key={item.id}
              style={[styles.itemCard, { width: itemWidth as any }]}
            >
              <View style={styles.itemImage}>
                <Text style={styles.itemEmoji}>
                  {item.emoji}
                </Text>
                {isOwned && (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>
                      보유 중
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription}>
                {item.description}
              </Text>

              <View style={styles.itemBottom}>
                <Text style={styles.itemPrice}>
                  🪙 {item.price.toLocaleString()}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.purchaseButton,
                    isOwned && styles.ownedButton,
                    insufficient && !isOwned && styles.lowCurrencyButton,
                  ]}
                  onPress={() => handlePurchase(item)}
                  disabled={isOwned || purchasingId !== null}
                >
                  <Text
                    style={[
                      styles.purchaseText,
                      isOwned && styles.ownedText,
                    ]}
                  >
                    {isPurchasing
                      ? '구매 중...'
                      : isOwned
                        ? '보유 중'
                        : insufficient
                          ? '재화 부족'
                          : '구매하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>🌿 나만의 독서 공간</Text>
        <Text style={styles.noticeDescription}>
          독서 퀘스트를 완료해 재화를 모아보세요.
          구매한 아이템은 추후 나의 서재 꾸미기 기능과
          연결할 예정이에요.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/reward/reward')}
      >
        <Text style={styles.primaryButtonText}>
          나의 레벨 확인하기 ›
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/reward/quest')}
      >
        <Text style={styles.secondaryButtonText}>
          퀘스트 확인하기 ›
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  content: {
    padding: 22,
    paddingBottom: 55,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F3',
  },
  loadingText: {
    marginTop: 12,
    color: '#777777',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backArea: {
    width: 35,
  },
  backText: {
    fontSize: 32,
    color: '#303B30',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#242B24',
  },
  testNotice: {
    color: '#95774F',
    fontSize: 12,
    marginBottom: 12,
  },
  currencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currencyLabel: {
    fontSize: 12,
    color: '#888888',
  },
  currencyValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#263B2B',
    marginTop: 8,
  },
  currencyLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#55765B',
  },
  guideCard: {
    backgroundColor: '#EAF0E7',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  guideIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#DCE7D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideEmoji: {
    fontSize: 29,
  },
  guideInfo: {
    flex: 1,
    marginLeft: 15,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#344F38',
  },
  guideDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#718171',
    marginTop: 7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#242B24',
  },
  itemCount: {
    fontSize: 12,
    color: '#888888',
  },
  categoryScroll: {
    marginBottom: 20,
    flexGrow: 0,
  },
  categoryRow: {
    gap: 9,
    paddingRight: 10,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E6DF',
  },
  categoryActive: {
    backgroundColor: '#5E7D61',
    borderColor: '#5E7D61',
  },
  categoryText: {
    color: '#718171',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    marginBottom: 16,
  },
  itemImage: {
    height: 125,
    borderRadius: 17,
    backgroundColor: '#F1EEE7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemEmoji: {
    fontSize: 48,
  },
  ownedBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    backgroundColor: '#E0E9DD',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ownedBadgeText: {
    fontSize: 10,
    color: '#4F7658',
    fontWeight: '800',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#303630',
    marginTop: 15,
  },
  itemDescription: {
    fontSize: 11,
    color: '#888888',
    lineHeight: 17,
    marginTop: 6,
    minHeight: 36,
  },
  itemBottom: {
    marginTop: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#526C55',
    marginBottom: 12,
  },
  purchaseButton: {
    backgroundColor: '#5E7D61',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  purchaseText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  lowCurrencyButton: {
    backgroundColor: '#A8B5A6',
  },
  ownedButton: {
    backgroundColor: '#E8EAE7',
  },
  ownedText: {
    color: '#777777',
  },
  noticeCard: {
    backgroundColor: '#F0EBDD',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    marginBottom: 22,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5A604F',
  },
  noticeDescription: {
    fontSize: 12,
    color: '#858174',
    lineHeight: 21,
    marginTop: 9,
  },
  primaryButton: {
    backgroundColor: '#5E7D61',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E2D7',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#55765B',
  },
});
