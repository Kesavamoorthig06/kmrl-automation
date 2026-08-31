import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, BarChart3, Settings, LogOut, User, Bell, ChevronDown, UserCog, Database, Shield, Palette, AlertTriangle, Languages, Sun, Moon, CalendarDays } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const Navbar = ({ currentPage, onPageChange, userInfo = { name: 'Admin User', role: 'Operations Manager' } }) => {
  const { t } = useTranslation();
  const { language, switchLanguage, setLanguageDirect } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const settingsRef = useRef(null);
  const notificationsRef = useRef(null);
  const languageRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home, path: 'selection' },
    { id: 'schedule', label: t('schedule'), icon: CalendarDays, path: 'schedule' },
    { id: 'alerts', label: t('alerts'), icon: AlertTriangle, path: 'alerts' },
  ];

  const settingsMenuItems = [
    { id: 'user-settings', label: t('userSettings'), icon: UserCog, path: 'user-settings' },
    { id: 'system-config', label: t('systemConfiguration'), icon: Database, path: 'system-config' },
    { id: 'security', label: t('securityPermissions'), icon: Shield, path: 'security' },
    { id: 'appearance', label: `${t('appearance')} (${theme === 'light' ? 'Light' : 'Dark'})`, icon: theme === 'light' ? Sun : Moon, path: 'appearance' },
  ];

  const notifications = [
    { id: 1, title: 'ML Simulation Completed', message: 'Train induction analysis finished successfully', time: '2 minutes ago', unread: true },
    { id: 2, title: 'System Maintenance', message: 'Scheduled maintenance completed at 02:00 AM', time: '1 hour ago', unread: true },
    { id: 3, title: 'New Train Data', message: 'Performance metrics updated for 14 trains', time: '3 hours ago', unread: false },
    { id: 4, title: 'Deployment Ready', message: 'Selected trains are ready for deployment', time: '5 hours ago', unread: false },
    { id: 5, title: 'Backup Complete', message: 'Daily data backup completed successfully', time: '1 day ago', unread: false },
  ];

  const handleNavClick = (item) => {
    onPageChange(item.path);
    setIsMenuOpen(false);
  };

  const handleSettingsClick = (item) => {
    if (item.id === 'appearance') {
      toggleTheme();
      setIsSettingsOpen(false);
      setIsMenuOpen(false);
    } else {
      onPageChange(item.path);
      setIsSettingsOpen(false);
      setIsMenuOpen(false);
    }
  };

  const toggleSettingsDropdown = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleNotificationsDropdown = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsSettingsOpen(false);
    setIsLanguageOpen(false);
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsSettingsOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleLanguageChange = (lang) => {
    setLanguageDirect(lang);
    setIsLanguageOpen(false);
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'en': return 'English';
      case 'ml': return 'മലയാളം';
      case 'hi': return 'हिंदी';
      default: return 'English';
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="bg-white/70 dark:bg-gray-800/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-800/60 border-b border-slate-200 dark:border-gray-700 shadow-sm sticky top-0 z-50" style={{ outline: 'none' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16" style={{ outline: 'none' }}>
          {/* Logo area */}
          <div className="flex items-center space-x-4" style={{ outline: 'none', border: 'none' }}>
            <img 
              src="/metro-logo.png"
              alt="KMRL Logo"
              className="h-8 w-auto object-contain opacity-90"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">KMRL</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md'
                  }`}
                >
                  <Icon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                  <span className="transition-all duration-200">{item.label}</span>
                </button>
              );
            })}
            
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={toggleSettingsDropdown}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  isSettingsOpen || currentPage.startsWith('settings') || currentPage.startsWith('user-settings') || currentPage.startsWith('system-config') || currentPage.startsWith('security') || currentPage.startsWith('appearance')
                    ? 'bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md'
                }`}
              >
                <Settings className="h-4 w-4 transition-transform duration-200 hover:scale-110 hover:rotate-90" />
                <span className="transition-all duration-200">{t('settings')}</span>
                <ChevronDown className={`h-3 w-3 transition-all duration-200 hover:scale-110 ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-slate-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {settingsMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.path;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSettingsClick(item)}
                          className={`flex items-center space-x-3 w-full px-4 py-2 text-sm text-left transition-all duration-200 ease-in-out transform hover:scale-102 hover:translate-x-1 ${
                            isActive 
                              ? 'bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' 
                              : 'text-slate-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                          }`}
                        >
                          <Icon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                          <span className="transition-all duration-200">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Language switcher, notifications, and user info */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative" ref={languageRef}>
              <button 
                onClick={toggleLanguageDropdown}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{getLanguageLabel()}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {/* Language Dropdown */}
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-slate-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        language === 'en' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-lg">🇺🇸</span>
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ml')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        language === 'ml' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-lg">🇮🇳</span>
                      <span>മലയാളം</span>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('hi')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        language === 'hi' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-lg">🇮🇳</span>
                      <span>हिंदी</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={toggleNotificationsDropdown}
                className="p-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-1 w-80 bg-white/95 backdrop-blur border border-slate-200 rounded-md shadow-lg z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">{t('notifications')}</h3>
                    <p className="text-xs text-gray-500">{unreadCount} {t('unread')}</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-white/60 transition-colors ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notification.unread ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                      {t('markAllAsRead')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{userInfo.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </div>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="p-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/80 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ease-in-out transform hover:scale-102 hover:translate-x-2 ${
                      isActive 
                        ? 'bg-slate-100 text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                    <span className="transition-all duration-200">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Settings Section */}
              <div className="border-t border-slate-200 pt-2 mt-2">
                <button
                  onClick={toggleSettingsDropdown}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ease-in-out transform hover:scale-102 hover:translate-x-2 ${
                    isSettingsOpen || currentPage.startsWith('settings') || currentPage.startsWith('user-settings') || currentPage.startsWith('system-config') || currentPage.startsWith('security') || currentPage.startsWith('appearance')
                      ? 'bg-slate-100 text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-sm'
                  }`}
                >
                  <Settings className="h-5 w-5 transition-transform duration-200 hover:scale-110 hover:rotate-90" />
                  <span className="transition-all duration-200">Settings</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-all duration-200 hover:scale-110 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mobile Settings Dropdown */}
                {isSettingsOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {settingsMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.path;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSettingsClick(item)}
                          className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm transition-all duration-200 ease-in-out transform hover:scale-102 hover:translate-x-2 ${
                            isActive 
                              ? 'bg-slate-100 text-slate-900 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-sm'
                          }`}
                        >
                          <Icon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                          <span className="transition-all duration-200">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile User Info */}
            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{userInfo.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
