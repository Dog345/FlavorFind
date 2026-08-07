import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../constants/config';

const DancingChefLoader = ({ message = "Finding delicious recipes..." }) => {
  // Animation values
  const bounce = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const hatBob = useRef(new Animated.Value(0)).current;
  const spoonSpin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main body bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -15,
          duration: 600,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 600,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Body wiggle
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Hat bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(hatBob, {
          toValue: -10,
          duration: 500,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(hatBob, {
          toValue: 0,
          duration: 500,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Spoon spin
    Animated.loop(
      Animated.sequence([
        Animated.timing(spoonSpin, {
          toValue: 1,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(spoonSpin, {
          toValue: -1,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(spoonSpin, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in/out for sparkles
    Animated.loop(
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const spoonRotate = spoonSpin.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <View style={styles.container}>
      {/* Animated sparkles */}
      <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: fade }]}>
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: Animated.subtract(1, fade) }]}>
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>

      {/* Chef Character */}
      <View style={styles.chefContainer}>
        {/* Hat */}
        <Animated.View style={[styles.hat, { transform: [{ translateY: hatBob }] }]}>
          <View style={styles.hatBase} />
          <View style={styles.hatTop} />
        </Animated.View>

        {/* Body */}
        <Animated.View style={[
          styles.body,
          {
            transform: [
              { translateY: bounce },
              { rotate: spin }
            ]
          }
        ]}>
          {/* Head */}
          <View style={styles.head}>
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.smile} />
            <View style={styles.cheekLeft} />
            <View style={styles.cheekRight} />
          </View>

          {/* Body */}
          <View style={styles.torso}>
            {/* Apron */}
            <View style={styles.apron} />
            {/* Buttons */}
            <View style={styles.button1} />
            <View style={styles.button2} />
          </View>

          {/* Arms */}
          <View style={styles.arms}>
            <View style={styles.leftArm}>
              <View style={styles.sleeveLeft} />
            </View>
            <Animated.View style={[styles.rightArm, { transform: [{ rotate: spoonRotate }] }]}>
              <View style={styles.sleeveRight} />
              <View style={styles.spoon}>
                <View style={styles.spoonHandle} />
                <View style={styles.spoonHead} />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Loading Message */}
      <Text style={styles.message}>{message}</Text>
      
      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        <Animated.Text style={[styles.dot, { opacity: fade }]}>.</Animated.Text>
        <Animated.Text style={[styles.dot, { opacity: Animated.subtract(1, fade) }]}>.</Animated.Text>
        <Animated.Text style={[styles.dot, { opacity: fade }]}>.</Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chefContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  hat: {
    alignItems: 'center',
    marginBottom: -5,
    zIndex: 2,
  },
  hatBase: {
    width: 50,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  hatTop: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: -15,
  },
  body: {
    alignItems: 'center',
  },
  head: {
    width: 60,
    height: 60,
    backgroundColor: '#F5DEB3',
    borderRadius: 30,
    position: 'relative',
    marginBottom: 5,
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  smile: {
    width: 20,
    height: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderRadius: 10,
    position: 'absolute',
    bottom: 15,
    left: 20,
  },
  cheekLeft: {
    width: 8,
    height: 8,
    backgroundColor: '#FFB6C1',
    borderRadius: 4,
    position: 'absolute',
    left: 8,
    bottom: 18,
  },
  cheekRight: {
    width: 8,
    height: 8,
    backgroundColor: '#FFB6C1',
    borderRadius: 4,
    position: 'absolute',
    right: 8,
    bottom: 18,
  },
  torso: {
    width: 50,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    position: 'relative',
  },
  apron: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 15,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  button1: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 22,
  },
  button2: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    position: 'absolute',
    top: 16,
    left: 22,
  },
  arms: {
    flexDirection: 'row',
    position: 'absolute',
    top: 20,
    left: -15,
    right: -15,
    justifyContent: 'space-between',
  },
  leftArm: {
    width: 25,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    transform: [{ rotate: '-20deg' }],
  },
  rightArm: {
    width: 25,
    height: 45,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  sleeveLeft: {
    width: '100%',
    height: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sleeveRight: {
    width: '100%',
    height: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  spoon: {
    position: 'absolute',
    right: -15,
    top: 5,
  },
  spoonHandle: {
    width: 20,
    height: 4,
    backgroundColor: '#C0C0C0',
    borderRadius: 2,
  },
  spoonHead: {
    width: 12,
    height: 12,
    backgroundColor: '#C0C0C0',
    borderRadius: 6,
    position: 'absolute',
    right: -8,
    top: -4,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: '30%',
    left: '20%',
  },
  sparkle2: {
    bottom: '30%',
    right: '20%',
  },
  sparkleText: {
    fontSize: 24,
  },
  message: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dot: {
    color: COLORS.primary,
    fontSize: 24,
    marginHorizontal: 2,
  },
});

export default DancingChefLoader;