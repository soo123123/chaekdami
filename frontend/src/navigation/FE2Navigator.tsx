import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SentenceScreen from '../screens/Review/SentenceScreen';
import ReviewWriteScreen from '../screens/Review/ReviewWriteScreen';
import ReviewDetailScreen from '../screens/Review/ReviewDetailScreen';

import RewardScreen from '../screens/Reward/RewardScreen';
import QuestScreen from '../screens/Reward/QuestScreen';
import ShopScreen from '../screens/Reward/ShopScreen';

import MyPageScreen from '../screens/User/MyPageScreen';

export type FE2StackParamList = {
  MyPage: undefined;

  Sentence: {
    readingRecordId: number;
  };

  ReviewWrite: {
    readingRecordId: number;
  };

  ReviewDetail: {
    reviewId: number;
  };

  Reward: undefined;
  Quest: undefined;
  Shop: undefined;
};

const Stack = createNativeStackNavigator<FE2StackParamList>();

const FE2Navigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyPage"
    >
      <Stack.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: '마이페이지',
        }}
      />

      <Stack.Screen
        name="Sentence"
        component={SentenceScreen}
        options={{
          title: '문장 모음',
        }}
      />

      <Stack.Screen
        name="ReviewWrite"
        component={ReviewWriteScreen}
        options={{
          title: '독후감 작성',
        }}
      />

      <Stack.Screen
        name="ReviewDetail"
        component={ReviewDetailScreen}
        options={{
          title: '독후감 상세',
        }}
      />

      <Stack.Screen
        name="Reward"
        component={RewardScreen}
        options={{
          title: '나의 보상',
        }}
      />

      <Stack.Screen
        name="Quest"
        component={QuestScreen}
        options={{
          title: '퀘스트',
        }}
      />

      <Stack.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: '상점',
        }}
      />
    </Stack.Navigator>
  );
};

export default FE2Navigator;
