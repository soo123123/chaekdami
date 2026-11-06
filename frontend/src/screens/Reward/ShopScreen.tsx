
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRewardStatus } from '../../api/rewardApi';

const COLORS = {
  background: '#FBF7F2',
  white: '#FFFCF9',
  green: '#365E49',
  paleGreen: '#E9EFE5',
  text: '#24211E',
  muted: '#77716D',
  border: '#EEE5DC',
};

const ART = {
  banner: require('../../../assets/images/shop/shop-banner-cat.png'),
  coin: require('../../../assets/images/shop/shop-coin.png'),
  categoryDeco: require('../../../assets/images/shop/shop-category-deco.png'),
  categoryPackage: require('../../../assets/images/shop/shop-category-package.png'),
  shield1: require('../../../assets/images/shop/shop-shield-1.png'),
  shield5: require('../../../assets/images/shop/shop-shield-5.png'),
  shield10: require('../../../assets/images/shop/shop-shield-10.png'),
  exp1: require('../../../assets/images/shop/shop-exp-1.png'),
  exp5: require('../../../assets/images/shop/shop-exp-5.png'),
  exp10: require('../../../assets/images/shop/shop-exp-10.png'),
  decorate: require('../../../assets/images/shop/shop-decorate.png'),
};

type Category = 'recommend' | 'decorate' | 'package';
type ProductType = 'shield' | 'exp';

type Product = {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  quantity: number;
  price: number;
  image: any;
};

const PRODUCTS: Product[] = [
  {
    id: 'shield-1',
    type: 'shield',
    name: 'D-day 방어권 1개',
    description: 'D-day를 하루 보호해요.',
    quantity: 1,
    price: 200,
    image: ART.shield1,
  },
  {
    id: 'shield-5',
    type: 'shield',
    name: 'D-day 방어권 5개',
    description: '더 든든하게 보호해요.',
    quantity: 5,
    price: 200,
    image: ART.shield5,
  },
  {
    id: 'shield-10',
    type: 'shield',
    name: 'D-day 방어권 10개',
    description: '넉넉하게 준비하세요.',
    quantity: 10,
    price: 200,
    image: ART.shield10,
  },
  {
    id: 'exp-1',
    type: 'exp',
    name: 'EXP 부스터 1개',
    description: '30분 동안 경험치 2배!',
    quantity: 1,
    price: 200,
    image: ART.exp1,
  },
  {
    id: 'exp-5',
    type: 'exp',
    name: 'EXP 부스터 5개',
    description: '2배 효과를 더 오래!',
    quantity: 5,
    price: 200,
    image: ART.exp5,
  },
  {
    id: 'exp-10',
    type: 'exp',
    name: 'EXP 부스터 10개',
    description: '꾸준한 성장의 지름길!',
    quantity: 10,
    price: 200,
    image: ART.exp10,
  },
];

function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <Image
      source={ART.coin}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  return (
    <View style={styles.productCard}>
      <View style={styles.quantityTag}>
        <Text style={styles.quantityText}>
          {product.quantity}개
        </Text>
      </View>

      <Image
        source={product.image}
        style={styles.productImage}
        resizeMode="contain"
      />

      <Text
        style={styles.productName}
        numberOfLines={2}
      >
        {product.name}
      </Text>

      <Text
        style={styles.productDescription}
        numberOfLines={2}
      >
        {product.description}
      </Text>

      <TouchableOpacity
        style={styles.priceButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <CoinIcon size={21} />
        <Text style={styles.priceText}>
          {product.price.toLocaleString()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProductSection({
  title,
  description,
  icon,
  products,
  onProductPress,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  products: Product[];
  onProductPress: (product: Product) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <Ionicons
          name={icon}
          size={24}
          color={COLORS.green}
        />

        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>
          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.productGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => onProductPress(product)}
          />
        ))}
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width <= 420;

  const [category, setCategory] =
    useState<Category>('recommend');

  const [coins, setCoins] = useState(1250);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [inventory, setInventory] =
    useState<Record<string, number>>({});

  const [message, setMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCoins() {
      try {
        const result = await getRewardStatus();

        if (
          active &&
          typeof result?.currency === 'number'
        ) {
          setCoins(result.currency);
        }
      } catch (error) {
        console.warn(
          '재화 조회 실패, 예시 재화 사용:',
          error
        );
      }
    }

    loadCoins();

    return () => {
      active = false;
    };
  }, []);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/user/mypage');
    }
  };

  const showMessage = (text: string) => {
    if (Platform.OS === 'web') {
      setMessage(text);
    } else {
      Alert.alert('재화 상점', text);
    }
  };

  const purchaseProduct = () => {
    if (!selectedProduct) return;

    const product = selectedProduct;

    if (coins < product.price) {
      setSelectedProduct(null);
      showMessage('보유 재화가 부족해요.');
      return;
    }

    setCoins((current) => current - product.price);

    setInventory((current) => ({
      ...current,
      [product.id]:
        (current[product.id] ?? 0) + product.quantity,
    }));

    setSelectedProduct(null);

    showMessage(
      `${product.name} 구매가 완료됐어요!\n\n` +
      '현재는 화면 테스트용 구매이며 서버에는 저장되지 않아요.'
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={29}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            재화 상점
          </Text>

          <View style={styles.coinBalance}>
            <CoinIcon size={26} />
            <Text style={styles.coinBalanceText}>
              {coins.toLocaleString()}개
            </Text>
          </View>
        </View>

        {/* 메인 배너 */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>
                책다듬이와 함께
              </Text>

              <Text style={styles.heroGreenTitle}>
                더 즐거운 독서를!
              </Text>
            </View>

            <Image
              source={ART.banner}
              style={[
                styles.heroImage,
                isCompact && styles.heroImageCompact,
              ]}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heroDescription}>
            필요한 아이템을 구매하고
            {'\n'}
            독서 생활을 더 풍요롭게 만들어보세요.
          </Text>
        </View>

        {/* 카테고리 */}
        <View style={styles.categoryBar}>
          <TouchableOpacity
            style={[
              styles.categoryItem,
              category === 'recommend' &&
                styles.categoryItemActive,
            ]}
            onPress={() => setCategory('recommend')}
          >
            <CoinIcon size={30} />
            <View style={styles.categoryText}>
              <Text style={styles.categoryTitle}>
                추천
              </Text>
              <Text style={styles.categorySubtitle}>
                필수 아이템
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryItem,
              category === 'decorate' &&
                styles.categoryItemActive,
            ]}
            onPress={() => setCategory('decorate')}
          >
            <Image
              source={ART.categoryDeco}
              style={styles.categoryImage}
              resizeMode="contain"
            />
            <View style={styles.categoryText}>
              <Text style={styles.categoryTitle}>
                꾸미기
              </Text>
              <Text style={styles.categorySubtitle}>
                준비중
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryItem,
              category === 'package' &&
                styles.categoryItemActive,
            ]}
            onPress={() => setCategory('package')}
          >
            <Image
              source={ART.categoryPackage}
              style={styles.categoryImage}
              resizeMode="contain"
            />
            <View style={styles.categoryText}>
              <Text style={styles.categoryTitle}>
                패키지
              </Text>
              <Text style={styles.categorySubtitle}>
                다양한 상품
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {category === 'recommend' ? (
          <>
            <ProductSection
              title="D-day 방어권"
              description="D-day 갱신을 하지 않아도 하루를 막아주는 아이템이에요."
              icon="shield-checkmark-outline"
              products={PRODUCTS.filter(
                (p) => p.type === 'shield'
              )}
              onProductPress={setSelectedProduct}
            />

            <ProductSection
              title="EXP 부스터"
              description="사용하는 동안 레벨 경험치가 2배로 증가해요!"
              icon="flask-outline"
              products={PRODUCTS.filter(
                (p) => p.type === 'exp'
              )}
              onProductPress={setSelectedProduct}
            />

            {/* 서재 꾸미기 */}
            <View style={styles.decorateCard}>
              <Image
                source={ART.decorate}
                style={styles.decorateImage}
                resizeMode="contain"
              />

              <View style={styles.decorateTextArea}>
                <View style={styles.decorateTitleRow}>
                  <Text style={styles.decorateTitle}>
                    서재 꾸미기
                  </Text>

                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>
                      준비중
                    </Text>
                  </View>
                </View>

                <Text style={styles.decorateDescription}>
                  나만의 서재를 꾸밀 수 있는 다양한 아이템이
                  곧 추가될 예정이에요. 기대해주세요!
                </Text>
              </View>
            </View>
          </>
        ) : category === 'decorate' ? (
          <View style={styles.emptyCategory}>
            <Image
              source={ART.decorate}
              style={styles.emptyImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>
              서재 꾸미기 준비 중
            </Text>

            <Text style={styles.emptyDescription}>
              나만의 서재를 꾸밀 수 있는
              {'\n'}
              다양한 아이템을 준비하고 있어요.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyCategory}>
            <Image
              source={ART.categoryPackage}
              style={styles.emptyImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>
              패키지 상품 준비 중
            </Text>

            <Text style={styles.emptyDescription}>
              특별한 아이템을 모은 패키지가
              {'\n'}
              곧 추가될 예정이에요.
            </Text>
          </View>
        )}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={COLORS.muted}
          />

          <Text style={styles.noticeText}>
            실제 구매 기능은 서버 연동 후 제공됩니다.
            현재는 구매 화면 테스트용입니다.
          </Text>
        </View>
      </ScrollView>

      {/* 구매 확인창 */}
      <Modal
        transparent
        visible={selectedProduct !== null}
        animationType="fade"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedProduct && (
              <>
                <Image
                  source={selectedProduct.image}
                  style={styles.modalProductImage}
                  resizeMode="contain"
                />

                <Text style={styles.modalTitle}>
                  {selectedProduct.name}
                </Text>

                <Text style={styles.modalDescription}>
                  이 상품을 구매할까요?
                </Text>

                <View style={styles.modalPrice}>
                  <CoinIcon size={25} />

                  <Text style={styles.modalPriceText}>
                    {selectedProduct.price.toLocaleString()}개
                  </Text>
                </View>

                <Text style={styles.modalBalance}>
                  현재 보유 재화: {coins.toLocaleString()}개
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() =>
                      setSelectedProduct(null)
                    }
                  >
                    <Text style={styles.cancelText}>
                      취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={purchaseProduct}
                  >
                    <Text style={styles.confirmText}>
                      구매하기
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 구매 결과 알림 */}
      <Modal
        transparent
        visible={message !== null}
        animationType="fade"
        onRequestClose={() => setMessage(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMessage(null)}
        >
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              재화 상점
            </Text>

            <Text style={styles.messageText}>
              {message}
            </Text>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => setMessage(null)}
            >
              <Text style={styles.messageButtonText}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 42,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 39,
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
  },

  coinBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  coinBalanceText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },

  hero: {
    minHeight: 220,
    marginBottom: 17,
    justifyContent: 'center',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 140,
  },

  heroText: {
    width: '52%',
    justifyContent: 'center',
    zIndex: 1,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  heroGreenTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.green,
    marginTop: 10,
  },

  heroImage: {
    width: '48%',
    height: 158,
  },

  heroImageCompact: {
    height: 146,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 21,
    color: '#5F5C57',
    marginTop: 6,
  },

  categoryBar: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    gap: 3,
    marginBottom: 15,
  },

  categoryItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 15,
    borderRadius: 15,
  },

  categoryItemActive: {
    backgroundColor: COLORS.paleGreen,
  },

  categoryImage: {
    width: 28,
    height: 33,
  },

  categoryText: {
    flexShrink: 1,
  },

  categoryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },

  categorySubtitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 4,
  },

  sectionCard: {
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingTop: 19,
    paddingBottom: 13,
    marginBottom: 15,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 9,
    paddingHorizontal: 3,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionDescription: {
    fontSize: 10,
    color: '#5F5C57',
    marginTop: 7,
    lineHeight: 16,
  },

  productGrid: {
    flexDirection: 'row',
    gap: 6,
  },

  productCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 252,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EAE1D8',
    backgroundColor: '#FFFBF7',
    paddingHorizontal: 5,
    paddingTop: 9,
    paddingBottom: 8,
    alignItems: 'center',
  },

  quantityTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.green,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  quantityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  productImage: {
    width: '100%',
    height: 91,
    marginTop: 1,
    marginBottom: 7,
  },

  productName: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 33,
  },

  productDescription: {
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.muted,
    textAlign: 'center',
    minHeight: 32,
    marginTop: 4,
  },

  priceButton: {
    width: '100%',
    minHeight: 39,
    borderRadius: 13,
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: '#DCE6D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 'auto',
  },

  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  decorateCard: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: 132,
  },

  decorateImage: {
    width: 112,
    height: 105,
  },

  decorateTextArea: {
    flex: 1,
  },

  decorateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  decorateTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  comingSoonBadge: {
    borderRadius: 13,
    backgroundColor: COLORS.paleGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.green,
  },

  decorateDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 9,
  },

  emptyCategory: {
    minHeight: 310,
    backgroundColor: COLORS.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },

  emptyImage: {
    width: 175,
    height: 150,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 12,
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
    paddingHorizontal: 12,
  },

  noticeText: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 17,
    flexShrink: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    padding: 23,
  },

  modalProductImage: {
    width: 125,
    height: 110,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 10,
  },

  modalDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 10,
  },

  modalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
  },

  modalPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  modalBalance: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 10,
  },

  modalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 13,
    backgroundColor: '#EFEAE4',
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  confirmButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 13,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },

  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  messageCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 23,
    alignItems: 'center',
  },

  messageTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },

  messageText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 15,
  },

  messageButton: {
    marginTop: 22,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },

  messageButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
