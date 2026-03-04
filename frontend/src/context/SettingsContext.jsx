'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const { user }                  = useAuth();
  const [settings, setSettings]   = useState(null);
  const [modules,  setModules]    = useState({});
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      await Promise.all([loadSettings(), loadModules()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.get(`/settings/${user.userId}`);
      setSettings(res.data.settings);
    } catch (err) {
      console.error('Could not load settings:', err);
    }
  };

  const loadModules = async () => {
    try {
      const res = await api.get(`/modules/user/${user.userId}`);
      const map = {};
      res.data.modules.forEach(m => { map[m.module_key] = m.is_enabled; });
      setModules(map);
    } catch (err) {
      console.error('Could not load modules:', err);
    }
  };

  const isEnabled = (key) => {
  if (Object.keys(modules).length === 0) return true; // modules not loaded yet, show everything
  if (modules[key] === undefined) return false;        // module exists but not assigned to user
  return modules[key] === true;
};
  const updateSettings = async (updates) => {
    const res = await api.patch(`/settings/${user.userId}`, updates);
    setSettings(res.data.settings);
  };

  const toggleModule = async (moduleKey, enabled) => {
    try {
      await api.patch('/modules/toggle', {
        userId:    user.userId,
        moduleKey,
        isEnabled: enabled,
      });
      setModules(prev => ({ ...prev, [moduleKey]: enabled }));
    } catch (err) {
      console.error('Could not toggle module:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      modules,
      loading,
      isEnabled,
      updateSettings,
      toggleModule,
      reloadModules: loadModules,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);