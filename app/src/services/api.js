import { API_BASE_URL } from '../constants/config';
import { Alert } from 'react-native';

// Test API connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Connected to AWS backend:', data);
    
    // Show key usage info if available
    if (data.keys) {
      console.log(`🔑 Active keys: ${data.keys.active}/${data.keys.total}`);
      console.log(`📊 Today's usage: ${data.usage.today}/${data.usage.capacity}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ API Connection Error:', error);
    throw error;
  }
};

// Search recipes by ingredients
export const searchRecipesByIngredients = async (ingredients) => {
  try {
    console.log(`🔍 Searching recipes for: ${ingredients}`);
    
    const response = await fetch(
      `${API_BASE_URL}/recipes?ingredients=${encodeURIComponent(ingredients)}`
    );
    
    // Check for rate limit headers
    const keyUsed = response.headers.get('X-Key-Used');
    const remaining = response.headers.get('X-Requests-Remaining');
    
    if (keyUsed) {
      console.log(`🔑 Using key: ${keyUsed}, ${remaining} requests remaining today`);
    }
    
    if (!response.ok) {
      // Try to parse error message from response
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new Error('Rate limit reached. All API keys exhausted for today. Please try again tomorrow.');
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.length} recipes`);
    
    // Log key usage stats if available
    if (remaining) {
      console.log(`📊 Requests remaining today: ${remaining}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error searching recipes:', error);
    throw error;
  }
};

// Get recipe details by ID
export const getRecipeDetails = async (recipeId) => {
  try {
    console.log(`🔍 Fetching recipe details for ID: ${recipeId}`);
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
    
    // Check for rate limit headers
    const keyUsed = response.headers.get('X-Key-Used');
    const remaining = response.headers.get('X-Requests-Remaining');
    
    if (keyUsed) {
      console.log(`🔑 Using key: ${keyUsed}, ${remaining} requests remaining today`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new Error('Rate limit reached. All API keys exhausted for today.');
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found recipe: ${data.title}`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching recipe details:', error);
    throw error;
  }
};

// Get API key statistics (useful for debugging)
export const getKeyStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Key Statistics:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching key stats:', error);
    throw error;
  }
};

// Check daily usage
export const getDailyUsage = async () => {
  try {
    const healthData = await testConnection();
    return {
      used: healthData.usage?.today || 0,
      total: healthData.usage?.capacity || 630,
      remaining: healthData.usage?.remaining || 630,
      utilization: healthData.usage?.utilization || '0%'
    };
  } catch (error) {
    console.error('❌ Error checking usage:', error);
    return null;
  }
};