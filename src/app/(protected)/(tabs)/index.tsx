import { View, FlatList, Dimensions, ViewToken, StyleSheet, ActivityIndicator, Text, useWindowDimensions } from 'react-native'
import React, { useRef, useState } from 'react'
import PostListItem from '@/components/PostListItem'; 
import posts from "@/data/posts.json"
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import FeedTab from '@/components/GenericComponents/FeedTab'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const TABS = {
  EXPLORE: 'Explore',
  FOLLOWING: 'Following',
  FOR_YOU: 'For You'
};
export default function HomeScreen() {
  const { height } = useWindowDimensions(); // ← prefer hook over Dimensions.get
  const tabBarHeight = useBottomTabBarHeight(); // ← exact tab bar height
  const ITEM_HEIGHT = height - tabBarHeight;
// accounts for home indicator
  const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState(TABS.FOR_YOU);
  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: ViewToken[]}) => {
 if (viewableItems.length > 0) {
setCurrentIndex(viewableItems[0]?.index || 0)
 }
  })
  console.log(currentIndex)
  return (
     <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <MaterialIcons name="live-tv" size={24} color="white" />
        <View style={styles.navigationBar}>
          <FeedTab title={TABS.EXPLORE} setActiveTab={setActiveTab} activeTab={activeTab} />
          <FeedTab title={TABS.FOLLOWING} setActiveTab={setActiveTab} activeTab={activeTab} />
          <FeedTab title={TABS.FOR_YOU} setActiveTab={setActiveTab} activeTab={activeTab} />
        </View>
        <Ionicons name="search" size={24} color="white" />
      </View>

      <FlatList
       style={{ flex: 1 }}
        data={posts}
        renderItem={({ item, index }) => (
          <PostListItem postItem={item} isActive={index === currentIndex} itemHeight={ITEM_HEIGHT} />
        )}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={"fast"}
        disableIntervalMomentum
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        
        onEndReachedThreshold={2}
      />
    
    </View>
  )
}

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 30
  },
  topBar: {
    flexDirection: 'row',
    position: 'absolute',
    top: 70,
    zIndex: 1,
    paddingHorizontal: 15
  }
})