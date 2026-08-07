// API Configuration
import Constants from 'expo-constants';

const { extra } = Constants.expoConfig || {};

// Change this to your new AWS API Gateway URL
export const API_BASE_URL = 'https://wmmz0kyh33.execute-api.us-east-1.amazonaws.com/prod/api';

export const COLORS = {
  primary: '#e87a3d',
  primaryDark: '#d96d2f',
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2d2d2d',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};