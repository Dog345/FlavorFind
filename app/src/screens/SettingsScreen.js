import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  Image,
  Linking,
  Animated,
  Easing,
  Share,
  Clipboard,
  ToastAndroid,
  Platform,
  Dimensions, // ← MISSING THIS
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/config';
import * as Updates from 'expo-updates';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as MailComposer from 'expo-mail-composer';

const { width } = Dimensions.get('window');

// ============== COMING SOON MODAL ==============
const ComingSoonModal = ({ visible, onClose, featureName }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeValue, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            <View style={styles.modalAnimations}>
              <Animated.Text style={[styles.modalEmoji, { transform: [{ rotate: spin }] }]}>
                👨‍🍳
              </Animated.Text>
              <Animated.Text style={[styles.modalEmoji, { transform: [{ translateY: bounceValue }] }]}>
                🍳
              </Animated.Text>
              <Animated.Text style={[styles.modalEmoji, { opacity: fadeValue }]}>
                ✨
              </Animated.Text>
            </View>

            <Text style={styles.modalTitle}>Coming Soon!</Text>
            <Text style={styles.modalSubtitle}>{featureName}</Text>
            
            <View style={styles.modalDivider} />
            
            <Text style={styles.modalDescription}>
              We're working hard to bring you this feature. Stay tuned!
            </Text>

            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
};

// ============== SETTINGS COMPONENTS ==============
const SettingsSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const SettingsItem = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  type = 'default',
  onValueChange,
  options = [],
  selectedOption,
  rightIcon = 'chevron',
}) => {
  const renderRightComponent = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={value ? '#fff' : '#f4f3f4'}
          />
        );
      case 'select':
        return (
          <View style={styles.selectContainer}>
            <Text style={styles.selectText}>{selectedOption}</Text>
            <Text style={styles.chevronIcon}>▶</Text>
          </View>
        );
      case 'info':
        return <Text style={styles.infoText}>{value}</Text>;
      default:
        return rightIcon === 'chevron' ? (
          <Text style={styles.chevronIcon}>▶</Text>
        ) : null;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemIcon}>{icon}</Text>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      {renderRightComponent()}
    </TouchableOpacity>
  );
};

const ContactCard = ({ icon, label, value, onPress, color }) => (
  <TouchableOpacity style={[styles.contactCard, { borderLeftColor: color }]} onPress={onPress}>
    <Text style={styles.contactIcon}>{icon}</Text>
    <View style={styles.contactInfo}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    <Text style={styles.contactArrow}>▶</Text>
  </TouchableOpacity>
);

const SocialButton = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={[styles.socialButton, { backgroundColor: color + '20' }]} onPress={onPress}>
    <Text style={[styles.socialIcon, { color }]}>{icon}</Text>
    <Text style={[styles.socialLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ============== MAIN SETTINGS SCREEN ==============
const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [measurementUnit, setMeasurementUnit] = useState('Metric (g/ml)');
  const [language, setLanguage] = useState('English');
  const [fontSize, setFontSize] = useState(16);
  const [autoSave, setAutoSave] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState('');
  const [appStats, setAppStats] = useState({
    recipesViewed: 0,
    savedRecipes: 0,
    searchesDone: 0,
    appOpens: 0,
  });

  // Load settings from storage
  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotifications(parsed.notifications ?? true);
        setDarkMode(parsed.darkMode ?? true);
        setMeasurementUnit(parsed.measurementUnit || 'Metric (g/ml)');
        setLanguage(parsed.language || 'English');
        setFontSize(parsed.fontSize || 16);
        setAutoSave(parsed.autoSave ?? true);
        setShowNutrition(parsed.showNutrition ?? true);
        setVideoAutoplay(parsed.videoAutoplay ?? false);
        setOfflineMode(parsed.offlineMode ?? false);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('appStats');
      if (stats) {
        setAppStats(JSON.parse(stats));
      }
    } catch (error) {
      console.log('Error loading stats:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        darkMode,
        measurementUnit,
        language,
        fontSize,
        autoSave,
        showNutrition,
        videoAutoplay,
        offlineMode,
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Show feedback based on platform
      if (Platform.OS === 'android') {
        ToastAndroid.show('Settings saved!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Settings saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const showComingSoon = (feature) => {
    setCurrentFeature(feature);
    setModalVisible(true);
  };

  // Contact Functions
  const handleEmail = () => {
    const email = 'dallaherick0@gmail.com';
    MailComposer.composeAsync({
      recipients: [email],
      subject: 'FlavorFind App Feedback',
      body: 'Hello,\n\nI have some feedback about FlavorFind:\n\n',
    }).catch(() => {
      // Fallback if mail composer fails
      Linking.openURL(`mailto:${email}`);
    });
  };

  const handleWhatsApp = (number) => {
    const url = `whatsapp://send?phone=${number}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  const handlePhone = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleSocial = (platform, username) => {
    let url = '';
    switch(platform) {
      case 'facebook':
        url = `fb://profile/${username}`;
        break;
      case 'instagram':
        url = `instagram://user?username=${username}`;
        break;
      case 'tiktok':
        url = `tiktok://@${username}`;
        break;
      case 'twitter':
        url = `twitter://user?screen_name=${username}`;
        break;
    }
    
    Linking.openURL(url).catch(() => {
      // Fallback to web browser
      const webUrls = {
        facebook: `https://facebook.com/${username}`,
        instagram: `https://instagram.com/${username}`,
        tiktok: `https://tiktok.com/@${username}`,
        twitter: `https://twitter.com/${username}`,
      };
      Linking.openURL(webUrls[platform]);
    });
  };

  const handleCopy = (text, message) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message || 'Copied!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', message || 'Text copied to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out FlavorFind - The ultimate recipe discovery app! 🍳\n\nFind delicious recipes based on ingredients you have at home.\n\nDownload now!',
        title: 'Share FlavorFind',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your saved recipes and settings will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear specific cache items but keep settings
              const settings = await AsyncStorage.getItem('appSettings');
              const stats = await AsyncStorage.getItem('appStats');
              await AsyncStorage.clear();
              if (settings) await AsyncStorage.setItem('appSettings', settings);
              if (stats) await AsyncStorage.setItem('appStats', stats);
              
              ToastAndroid.show('Cache cleared!', ToastAndroid.SHORT);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setNotifications(true);
            setDarkMode(true);
            setMeasurementUnit('Metric (g/ml)');
            setLanguage('English');
            setFontSize(16);
            setAutoSave(true);
            setShowNutrition(true);
            setVideoAutoplay(false);
            setOfflineMode(false);
            saveSettings();
          }
        }
      ]
    );
  };

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version is ready. Update now?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update', onPress: () => Updates.reloadAsync() }
          ]
        );
      } else {
        Alert.alert('Up to Date', 'You have the latest version!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check for updates');
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card */}
        <LinearGradient
          colors={[COLORS.primary + '40', COLORS.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Guest User</Text>
            <Text style={styles.profileEmail}>guestuser@gmail.com</Text>
            <View style={styles.profileBadges}>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>🔥 127 recipes</Text>
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>⭐ Chef Level 5</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => showComingSoon('Profile Editor')}
          >
            <Text style={styles.editButtonText}>✎</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <StatCard icon="👁️" label="Recipes Viewed" value={appStats.recipesViewed || 128} />
          <StatCard icon="❤️" label="Saved" value={appStats.savedRecipes || 24} />
          <StatCard icon="🔍" label="Searches" value={appStats.searchesDone || 342} />
          <StatCard icon="📱" label="App Opens" value={appStats.appOpens || 89} />
        </View>

        {/* Contact Developer Section */}
        <SettingsSection title="📞 Contact Developer">
          <ContactCard
            icon="📧"
            label="Email"
            value="dallaherick0@gmail.com"
            color="#EA4335"
            onPress={handleEmail}
          />
          <ContactCard
            icon="📱"
            label="WhatsApp"
            value="0796605409 / 0704291657"
            color="#25D366"
            onPress={() => handleWhatsApp('254796605409')}
          />
          <ContactCard
            icon="📞"
            label="Phone"
            value="0796605409"
            color="#34B7F1"
            onPress={() => handlePhone('254796605409')}
          />
          <ContactCard
            icon="📋"
            label="Copy Email"
            value="dallaherick0@gmail.com"
            color="#9CA3AF"
            onPress={() => handleCopy('dallaherick0@gmail.com', 'Email copied!')}
          />
        </SettingsSection>

        {/* App Settings Section */}
        <SettingsSection title="⚙️ App Settings">
          <SettingsItem
            icon="🔔"
            label="Notifications"
            type="switch"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingsItem
            icon="🌙"
            label="Dark Mode"
            type="switch"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingsItem
            icon="📏"
            label="Measurement Unit"
            type="select"
            selectedOption={measurementUnit}
            onPress={() => showComingSoon('Measurement Unit Selection')}
          />
          <SettingsItem
            icon="🗣️"
            label="Language"
            type="select"
            selectedOption={language}
            onPress={() => showComingSoon('Language Selection')}
          />
          <SettingsItem
            icon="🔤"
            label="Font Size"
            type="info"
            value={`${fontSize}px`}
            onPress={() => showComingSoon('Font Size Adjustment')}
          />
        </SettingsSection>

        {/* Recipe Preferences */}
        <SettingsSection title="🍳 Recipe Preferences">
          <SettingsItem
            icon="💾"
            label="Auto-save Recipes"
            type="switch"
            value={autoSave}
            onValueChange={setAutoSave}
          />
          <SettingsItem
            icon="📊"
            label="Show Nutrition Info"
            type="switch"
            value={showNutrition}
            onValueChange={setShowNutrition}
          />
          <SettingsItem
            icon="▶️"
            label="Video Autoplay"
            type="switch"
            value={videoAutoplay}
            onValueChange={setVideoAutoplay}
          />
          <SettingsItem
            icon="📴"
            label="Offline Mode"
            type="switch"
            value={offlineMode}
            onValueChange={setOfflineMode}
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="👤 Account">
          <SettingsItem
            icon="👤"
            label="My Profile"
            onPress={() => showComingSoon('User Profiles')}
          />
          <SettingsItem
            icon="❤️"
            label="Favorite Recipes"
            value="24 saved"
            type="info"
            onPress={() => showComingSoon('Favorites')}
          />
          <SettingsItem
            icon="📋"
            label="Shopping Lists"
            onPress={() => showComingSoon('Shopping Lists')}
          />
          <SettingsItem
            icon="📅"
            label="Meal Planner"
            onPress={() => showComingSoon('Meal Planner')}
          />
          <SettingsItem
            icon="🏆"
            label="Achievements"
            value="12 unlocked"
            type="info"
            onPress={() => showComingSoon('Achievements')}
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="ℹ️ About">
          <View style={styles.aboutCard}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.aboutLogo}
            />
            <Text style={styles.aboutTitle}>FlavorFind</Text>
            <Text style={styles.aboutVersion}>Version 1.2.0 (Build 42)</Text>
            <Text style={styles.aboutDescription}>
              Discover amazing recipes based on ingredients you have at home. 
              AI-powered recipe matching with 14 API keys for 630 daily searches.
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>API Keys</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>630</Text>
                <Text style={styles.statLabel}>Daily Searches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            <View style={styles.aboutLinks}>
              <TouchableOpacity onPress={() => Linking.openURL('https://flavorfind.com/privacy')}>
                <Text style={styles.aboutLink}>Privacy</Text>
              </TouchableOpacity>
              <Text style={styles.aboutLinkDot}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://flavorfind.com/terms')}>
                <Text style={styles.aboutLink}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.aboutLinkDot}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://flavorfind.com')}>
                <Text style={styles.aboutLink}>Website</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyright}>
              © 2025 FlavorFind. All rights reserved.
            </Text>
            <Text style={styles.developerCredit}>
              Built with ❤️ by Dallah
            </Text>
          </View>
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="💬 Support">
          <SettingsItem
            icon="📝"
            label="Send Feedback"
            onPress={handleEmail}
          />
          <SettingsItem
            icon="⭐"
            label="Rate the App"
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.iamone.flavorfind')}
          />
          <SettingsItem
            icon="📤"
            label="Share FlavorFind"
            onPress={handleShare}
          />
          <SettingsItem
            icon="🔄"
            label="Check for Updates"
            onPress={checkForUpdates}
          />
          <SettingsItem
            icon="❓"
            label="FAQ & Help"
            onPress={() => showComingSoon('FAQ')}
          />
        </SettingsSection>

        {/* Data & Storage */}
        <SettingsSection title="💾 Data & Storage">
          <SettingsItem
            icon="🗑️"
            label="Clear Cache"
            onPress={clearCache}
          />
          <SettingsItem
            icon="📊"
            label="App Statistics"
            value="View stats"
            type="info"
            onPress={() => {
              Alert.alert(
                'App Statistics',
                `Recipes Viewed: ${appStats.recipesViewed}\nSaved Recipes: ${appStats.savedRecipes}\nSearches Done: ${appStats.searchesDone}\nApp Opens: ${appStats.appOpens}`,
                [{ text: 'OK' }]
              );
            }}
          />
          <SettingsItem
            icon="🔄"
            label="Reset All Settings"
            onPress={resetSettings}
          />
          <SettingsItem
            icon="📤"
            label="Export Data"
            onPress={() => showComingSoon('Data Export')}
          />
        </SettingsSection>

        {/* Developer Info */}
        <SettingsSection title="👨‍💻 Developer">
          <View style={styles.developerCard}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
              style={styles.developerIcon}
            />
            <View style={styles.developerInfo}>
              <Text style={styles.developerName}>Dallah</Text>
              <Text style={styles.developerRole}>Full Stack Developer</Text>
              <Text style={styles.developerContact}>dallaherick0@gmail.com</Text>
              <Text style={styles.developerContact}>📱 0796605409 / 0704291657</Text>
            </View>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleWhatsApp('254796605409')}
            >
              <LinearGradient colors={['#25D366', '#128C7E']} style={styles.quickActionGradient}>
                <Text style={styles.quickActionIcon}>📱</Text>
                <Text style={styles.quickActionText}>WhatsApp</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleEmail}
            >
              <LinearGradient colors={['#EA4335', '#BB2F25']} style={styles.quickActionGradient}>
                <Text style={styles.quickActionIcon}>📧</Text>
                <Text style={styles.quickActionText}>Email</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SettingsSection>

        {/* Save Settings Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>💾 Save Settings</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        featureName={currentFeature}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  profileBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  profileBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  editButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  itemLabel: {
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 10,
  },
  chevronIcon: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderLeftWidth: 3,
  },
  contactIcon: {
    fontSize: 22,
    width: 40,
    textAlign: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  contactArrow: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  socialButton: {
    width: (width - 80) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  socialIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  aboutCard: {
    padding: 20,
    alignItems: 'center',
  },
  aboutLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  aboutTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aboutVersion: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  aboutDescription: {
    color: COLORS.text,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  aboutLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutLink: {
    color: COLORS.primary,
    fontSize: 13,
    marginHorizontal: 8,
  },
  aboutLinkDot: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  copyright: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  developerCredit: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  developerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  developerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  developerRole: {
    color: COLORS.primary,
    fontSize: 12,
    marginBottom: 4,
  },
  developerContact: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 0,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 16,
    color: '#fff',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 30,
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    width: width * 0.8,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalAnimations: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  modalDivider: {
    width: 50,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;