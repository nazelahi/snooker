import { useState, useEffect, useCallback } from 'react';
import jwt_decode from 'jwt-decode';

export function useCustomAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Decode JWT and set user
  const loadUserFromToken = useCallback(() => {
    const token = localStorage.getItem('custom_jwt');
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        setUser(decoded);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('custom_jwt');
    if (!token) return;
    const res = await fetch('/api/custom-profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.user);
    } else {
      setProfile(null);
    }
  }, []);

  // Login helper
  const login = useCallback((token: string) => {
    localStorage.setItem('custom_jwt', token);
    loadUserFromToken();
    fetchProfile();
  }, [loadUserFromToken, fetchProfile]);

  // Logout helper
  const logout = useCallback(() => {
    localStorage.removeItem('custom_jwt');
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    loadUserFromToken();
    fetchProfile();
    setLoading(false);
  }, [loadUserFromToken, fetchProfile]);

  return { user, profile, loading, login, logout, fetchProfile };
} 