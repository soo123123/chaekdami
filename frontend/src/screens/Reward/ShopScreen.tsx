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
  getRewardStatus,
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

  const [isLoading, setIsLoading] =
    useState(true);

  const [purchasingId, setPurchasingId] =
    useState<number | null>(null);

  // 상점 아이템 목록
  // 백엔드의 상점 목록 API가 확정되면
  // 실제 API 데이터로 교체
  const [items, setItems] = useState<ShopItem[]>([
    {
      id: 1,
      name: '작은 화분',
      description: '서재를 꾸밀 수 있는 작은 화분',
      price: 100,
      emoji: '🪴',
      category: 'PLANT',
      owned: false,
    },
    {
      id: 2,
      name: '책 더미',
      description: '책이 쌓여 있는 장식 아이템',
      price: 150,
      emoji: '📚',
      category: 'DECORATION',
      owned: false,
    },
    {
      id: 3,
      name: '독서 스탠드',
      description: '따뜻한 분위기의 독서 스탠드',
      price: 250,
      emoji: '💡',
      category: 'FURNITURE',
      owned: false,
    },
    {
      id: 4,
      name: '독서 의자',
      description: '편안한 독서용 의자',
      price: 400,
      emoji: '🪑',
      category: 'FURNITURE',
      owned: false,
    },
    {
      id: 5,
      name: '고양이 장식',
      description: '서재에 놓을 수 있는 고양이 장식',
      price: 500,
      emoji: '🐱',
      category: 'DECORATION',
      owned: false,
    },
  ]);

  // 보유 재화 조회
  useEffect(() => {
    const loadReward = async () => {
      try {
        const data =
          await getRewardStatus();

        setCurrency(
          data?.currency ?? 0
        );
      } catch (error) {
        console.error(
          '재화 정보 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용
        setCurrency(1250);
      } finally {
        setIsLoading(false);
      }
    };

    loadReward();
  }, []);

  // 아이템 구매
  const handlePurchase = (
    item: ShopItem
  ) => {
    if (item.owned) {
      Alert.alert(
        '알림',
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

    Alert.alert(
      '아이템 구매',
      `${item.name}을(를) ${item.price} 재화로 구매하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '구매',
          onPress: async () => {
            try {
              setPurchasingId(item.id);

              await purchaseItem(
                item.id
              );

              // 구매 성공 시 화면 상태 변경
              setCurrency(
                current =>
                  current - item.price
              );

              setItems(currentItems =>
                currentItems.map(
                  currentItem =>
                    currentItem.id ===
                    item.id
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
                '백엔드 연결 상태를 확인해주세요.'
              );
            } finally {
              setPurchasingId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

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
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          상점
        </Text>

        <View
          style={styles.headerSpace}
        />
      </View>

      {/* 보유 재화 */}
      <View style={styles.currencyCard}>
        <View>
          <Text style={styles.currencyLabel}>
            나의 보유 재화
          </Text>

          <Text style={styles.currencyValue}>
            🪙 {currency}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push('/quest')
          }
        >
          <Text style={styles.questLink}>
            재화 얻기 ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* 상점 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          🛍️
        </Text>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            나만의 서재를 꾸며보세요
          </Text>

          <Text
            style={styles.guideDescription}
          >
            독서 활동으로 모은 재화를
            사용해 다양한 아이템을
            구매할 수 있어요.
          </Text>
        </View>
      </View>

      {/* 상품 목록 */}
      <Text style={styles.sectionTitle}>
        아이템
      </Text>

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
            >
              {item.description}
            </Text>

            <Text style={styles.itemPrice}>
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
              onPress={() =>
                handlePurchase(item)
              }
              disabled={
                item.owned ||
                purchasingId === item.id
              }
            >
              <Text
                style={[
                  styles.purchaseButtonText,

                  item.owned &&
                    styles.ownedButtonText,
                ]}
              >
                {purchasingId ===
                item.id
                  ? '구매 중...'
                  : item.owned
                    ? '보유 중'
                    : '구매하기'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 레벨 화면 */}
      <TouchableOpacity
        style={styles.rewardButton}
        onPress={() =>
          router.push('/reward')
        }
      >
        <Text
          style={styles.rewardButtonText}
        >
          나의 레벨 확인하기
        </Text>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>
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
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f3',
  },

  loadingText: {
    marginTop: 10,
    color: '#777777',
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
    fontSize: 12,
    color: '#777777',
  },

  currencyValue: {
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 5,
  },

  questLink: {
    color: '#4f7658',
    fontSize: 13,
    fontWeight: 'bold',
  },

  guideCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  guideEmoji: {
    fontSize: 34,
  },

  guideContent: {
    flex: 1,
    marginLeft: 14,
  },

  guideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  guideDescription: {
    fontSize: 11,
    color: '#777777',
    lineHeight: 17,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  itemCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  itemImage: {
    height: 90,
    borderRadius: 14,
    backgroundColor: '#f2eee6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemEmoji: {
    fontSize: 42,
  },

  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },

  itemDescription: {
    fontSize: 10,
    color: '#777777',
    lineHeight: 15,
    marginTop: 5,
    minHeight: 30,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
  },

  purchaseButton: {
    backgroundColor: '#4f7658',
    borderRadius: 15,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 10,
  },

  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.5,
  },

  ownedButton: {
    backgroundColor: '#eeeeee',
  },

  ownedButtonText: {
    color: '#777777',
  },

  rewardButton: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  rewardButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },

  arrow: {
    fontSize: 24,
    color: '#777777',
  },
});
