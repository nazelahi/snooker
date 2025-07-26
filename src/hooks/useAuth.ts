import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
}

interface Profile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Decode JWT and set user
  const loadUserFromToken = useCallback(() => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    const token = localStorage.getItem('custom_jwt');
    console.log('Loading user from token:', token ? 'Token exists' : 'No token');
    
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        setUser(decoded);
      } catch (error) {
        console.error('Error decoding JWT:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    const token = localStorage.getItem('custom_jwt');
    console.log('Fetching profile with token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      setProfile(null);
      return;
    }
    
    try {
      const res = await fetch('/api/custom-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Profile API response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Profile data:', data);
        setProfile(data.user);
      } else {
        console.log('Profile API error:', res.status, res.statusText);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }, []);

  // Login helper
  const login = useCallback((token: string) => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    console.log('Login helper called with token');
    localStorage.setItem('custom_jwt', token);
    loadUserFromToken();
    fetchProfile();
  }, [loadUserFromToken, fetchProfile]);

  // Logout helper
  const logout = useCallback(() => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    console.log('Logout helper called');
    localStorage.removeItem('custom_jwt');
    setUser(null);
    setProfile(null);
  }, []);

  // Set mounted state
  useEffect(() => {
    console.log('Setting mounted to true');
    setMounted(true);
  }, []);

  // Load user data after component mounts
  useEffect(() => {
    if (mounted) {
      console.log('Component mounted, loading user data');
      loadUserFromToken();
      fetchProfile();
      setLoading(false);
    }
  }, [mounted, loadUserFromToken, fetchProfile]);

  return { 
    user, 
    profile, 
    loading: loading || !mounted, 
    login, 
    logout, 
    fetchProfile,
    isAuthenticated: !!user,
    mounted 
  };
} 