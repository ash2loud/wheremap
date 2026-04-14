import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const MAP_SIZE = width * 0.9;
const SNACK_API_KEY = "apikeygoeshere"

// get api key from app.json extra config, or the constant above
const gmapkey = Constants.expoConfig?.extra?.gmapkey || SNACK_API_KEY || '';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [nearestRestaurant, setNearestRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // debug logs
    console.log('=== WhereMap Debug Info ===');
    console.log('Platform:', Platform.OS);
    console.log('API Key present:', gmapkey ? 'YES' : 'NO');
    console.log('API Key starts with:', gmapkey.substring(0, 10));
    console.log('========================');
    
    // checks if api key is added
    if (!gmapkey || gmapkey === 'apikeygoeshere') {
      setError('Google Maps API key not configured');
      setLoading(false);
      Alert.alert(
        'Configuration Error',
        'Please add your Google Maps API key to app.json. See README.md for instructions.'
      );
      return;
    }
    
    // this is a failsafe, forces loading off after 15 seconds
    const timeout = setTimeout(() => {
      console.log('⚠️ Timeout reached, forcing loading off');
      setLoading(false);
    }, 15000);
    
    initializeApp().finally(() => {
      clearTimeout(timeout);
    });
    
    return () => clearTimeout(timeout);
  }, []);

  const initializeApp = async () => {
    try {
      // requests location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to use this app.'
        );
        return;
      }

      // gets current location
      console.log('Getting location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('Location obtained:', userCoords);
      setUserLocation(userCoords);

      // gets user's address using reverse geocoding
      await getUserAddress(userCoords);

      // finds nearest restaurant
      await findNearestRestaurant(userCoords);

      console.log('All data loaded, hiding loading screen');
      setLoading(false);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError(err.message);
      setLoading(false);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  const getUserAddress = async (coords) => {
    try {
      console.log('Fetching address...');
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${gmapkey}`
      );

      console.log('Geocoding response status:', response.data.status);
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.error('Geocoding API denied:', response.data.error_message);
        Alert.alert('API Error', 'Geocoding API request denied. Check your API key and enabled APIs.');
      }

      if (response.data.results && response.data.results.length > 0) {
        setUserAddress(response.data.results[0].formatted_address);
        console.log('Address found:', response.data.results[0].formatted_address);
      }
    } catch (err) {
      console.error('Error getting user address:', err);
      setUserAddress('Address unavailable');
    }
  };

  const findNearestRestaurant = async (coords) => {
    try {
      console.log('Searching for restaurants...');
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.latitude},${coords.longitude}&radius=1500&type=restaurant&key=${gmapkey}`
      );

      console.log('Places API response status:', response.data.status);
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.error('Places API denied:', response.data.error_message);
        Alert.alert('API Error', 'Places API request denied. Check your API key and enabled APIs.');
      }

      if (response.data.results && response.data.results.length > 0) {
        const restaurant = response.data.results[0];
        
        setNearestRestaurant({
          name: restaurant.name,
          latitude: restaurant.geometry.location.lat,
          longitude: restaurant.geometry.location.lng,
          address: restaurant.vicinity,
        });
        
        console.log('Restaurant found:', restaurant.name);
      } else {
        console.log('No restaurants found nearby');
        setNearestRestaurant(null);
      }
    } catch (err) {
      console.error('Error finding restaurant:', err);
      Alert.alert('Error', 'Failed to find nearby restaurants.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (error || !userLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load location</Text>
        <Text style={styles.errorSubtext}>{error || 'Please check your settings'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* user location info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Your Location</Text>
        <Text style={styles.coordText}>
          Latitude: {userLocation.latitude.toFixed(6)}
        </Text>
        <Text style={styles.coordText}>
          Longitude: {userLocation.longitude.toFixed(6)}
        </Text>
        <Text style={styles.addressText}>{userAddress}</Text>
      </View>

      {/* map display */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showsUserLocation
          followsUserLocation
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* user location marker */}
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
          />

          {/* restaurant marker */}
          {nearestRestaurant && (
            <Marker
              coordinate={{
                latitude: nearestRestaurant.latitude,
                longitude: nearestRestaurant.longitude,
              }}
              title={nearestRestaurant.name}
              description="Nearest Restaurant"
            />
          )}
        </MapView>
      </View>

      {/* restaurant info */}
      <View style={styles.infoContainer}>
        {nearestRestaurant ? (
          <>
            <Text style={styles.infoTitle}>Nearest Restaurant</Text>
            <Text style={styles.restaurantName}>{nearestRestaurant.name}</Text>
            <Text style={styles.coordText}>
              Latitude: {nearestRestaurant.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordText}>
              Longitude: {nearestRestaurant.longitude.toFixed(6)}
            </Text>
            <Text style={styles.addressText}>{nearestRestaurant.address}</Text>
          </>
        ) : (
          <Text style={styles.noRestaurantText}>No restaurant found nearby</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: MAP_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  coordText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#777',
    marginTop: 5,
    fontStyle: 'italic',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
    marginBottom: 5,
  },
  noRestaurantText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
