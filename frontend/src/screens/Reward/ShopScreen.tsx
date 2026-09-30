import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { purchaseItem } from '../../api/rewardApi';

interface ShopItem {
  id: number;
  name: string;
  price: number;
  type: string;
}

const ShopScreen = () => {
  // 임시 상점 데이터
  // 추후 상점 조회 API가 정해지면 서버 데이터로 변경
  const [items] = useState<ShopItem[]>([
    {
      id: 1,
      name: '독서 응원 아이템',
      price: 100,
      type: 'ITEM',
    },
    {
      id: 2,
      name: '프로필 꾸미기 아이템',
      price: 200,
      type: 'ITEM',
    },
  ]);

  const handlePurchase = (item: ShopItem) => {
    Alert.alert(
      '상품 구매',
      `${item.name}을(를) ${item.price} Coin에 구매하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '구매',
          onPress: async () => {
            try {
              await purchaseItem(item.id);

              Alert.alert(
                '구매 완료',
                '상품을 구매했습니다.'
              );
            } catch (error) {
              console.error('상품 구매 실패:', error);

              Alert.alert(
                '구매 실패',
                '상품을 구매하지 못했습니다.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>상점</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.name}
              </Text>

              <Text style={styles.price}>
                {item.price} Coin
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handlePurchase(item)}
            >
              <Text style={styles.buttonText}>
                구매
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default ShopScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },

  itemInfo: {
    marginBottom: 12,
  },

  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  price: {
    fontSize: 16,
    marginTop: 8,
  },

  button: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },

  buttonText: {
    fontWeight: 'bold',
  },
});
