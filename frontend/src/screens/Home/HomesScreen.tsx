import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

const HomeScreen = () => {
  // FE1 담당 화면
  // 나중에 FE1이 만든 실제 route로 변경
  const handleStartReading = () => {
    Alert.alert(
      '독서 시작',
      'FE1 담당 독서 시작 화면과 연결할 예정입니다.'
    );
  };

  // FE1 담당 화면
  const handleLibrary = () => {
    Alert.alert(
      '나의 서재',
      'FE1 담당 나의 서재 화면과 연결할 예정입니다.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            책다듬이
          </Text>

          <Text style={styles.greeting}>
            오늘도 책과 함께 성장해요.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/mypage')}
        >
          <Text style={styles.profileEmoji}>
            🐱
          </Text>
        </TouchableOpacity>
      </View>

      {/* 오늘의 독서 */}
      <View style={styles.heroCard}>
        <View style={styles.heroTextArea}>
          <Text style={styles.heroSmall}>
            오늘의 독서
          </Text>

          <Text style={styles.heroTitle}>
            오늘도 한 페이지{'\n'}
            읽어볼까요?
          </Text>

          <Text style={styles.heroDescription}>
            꾸준한 독서가 작은 변화를 만들어요.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartReading}
          >
            <Text style={styles.startButtonText}>
              독서 시작하기
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroEmoji}>
          📖
        </Text>
      </View>

      {/* 현재 읽는 책 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          현재 읽는 책
        </Text>

        <TouchableOpacity
          onPress={handleLibrary}
        >
          <Text style={styles.moreText}>
            전체보기 ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bookCard}>
        <View style={styles.bookCover}>
          <Text style={styles.bookEmoji}>
            📚
          </Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>
            읽고 있는 책
          </Text>

          <Text style={styles.bookAuthor}>
            도서 정보
          </Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              독서 진행률
            </Text>

            <Text style={styles.progressValue}>
              45%
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { width: '45%' },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 오늘의 독서 현황 */}
      <Text style={styles.sectionTitle}>
        오늘의 독서 현황
      </Text>

      <View style={styles.statContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>
            ⏱️
          </Text>

          <Text style={styles.statValue}>
            30분
          </Text>

          <Text style={styles.statLabel}>
            오늘 독서 시간
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>
            📖
          </Text>

          <Text style={styles.statValue}>
            25쪽
          </Text>

          <Text style={styles.statLabel}>
            오늘 읽은 페이지
          </Text>
        </View>
      </View>

      {/* 빠른 메뉴 */}
      <Text style={styles.sectionTitle}>
        빠른 메뉴
      </Text>

      <View style={styles.menuContainer}>
        {/* FE1 */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handleLibrary}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.menuEmoji}>
              📚
            </Text>
          </View>

          <View style={styles.menuTextArea}>
            <Text style={styles.menuTitle}>
              나의 서재
            </Text>

            <Text style={styles.menuDescription}>
              등록한 책 확인하기
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        {/* FE2 */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            router.push('/reading-stats')
          }
        >
          <View style={styles.menuIcon}>
            <Text style={styles.menuEmoji}>
              📊
            </Text>
          </View>

          <View style={styles.menuTextArea}>
            <Text style={styles.menuTitle}>
              독서 통계
            </Text>

            <Text style={styles.menuDescription}>
              나의 독서 활동 확인하기
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        {/* FE2 */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            router.push('/mypage')
          }
        >
          <View style={styles.menuIcon}>
            <Text style={styles.menuEmoji}>
              👤
            </Text>
          </View>

          <View style={styles.menuTextArea}>
            <Text style={styles.menuTitle}>
              마이페이지
            </Text>

            <Text style={styles.menuDescription}>
              내 정보 확인하기
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  logo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#3f6548',
  },

  greeting: {
    fontSize: 12,
    marginTop: 5,
    color: '#777777',
  },

  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#eee8dc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileEmoji: {
    fontSize: 23,
  },

  heroCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  heroTextArea: {
    flex: 1,
  },

  heroSmall: {
    fontSize: 12,
    color: '#52705a',
    fontWeight: 'bold',
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginTop: 7,
  },

  heroDescription: {
    fontSize: 11,
    color: '#666666',
    marginTop: 8,
  },

  heroEmoji: {
    fontSize: 55,
    marginLeft: 10,
  },

  startButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4f7658',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 16,
  },

  startButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  moreText: {
    fontSize: 12,
    color: '#52705a',
    marginBottom: 12,
  },

  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 28,
  },

  bookCover: {
    width: 65,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee9df',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookEmoji: {
    fontSize: 30,
  },

  bookInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },

  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  bookAuthor: {
    fontSize: 11,
    color: '#777777',
    marginTop: 4,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  progressLabel: {
    fontSize: 11,
  },

  progressValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  progressBackground: {
    height: 7,
    backgroundColor: '#eeeeee',
    borderRadius: 5,
    marginTop: 6,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#4f7658',
    borderRadius: 5,
  },

  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },

  statEmoji: {
    fontSize: 24,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 7,
  },

  statLabel: {
    fontSize: 10,
    color: '#777777',
    marginTop: 4,
  },

  menuContainer: {
    gap: 10,
  },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#f2eee6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuEmoji: {
    fontSize: 21,
  },

  menuTextArea: {
    flex: 1,
    marginLeft: 13,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  menuDescription: {
    fontSize: 11,
    color: '#777777',
    marginTop: 3,
  },

  arrow: {
    fontSize: 24,
    color: '#777777',
  },
});
