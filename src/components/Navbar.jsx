import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, BarChart3, Settings, LogOut, User, Bell, ChevronDown, UserCog, Database, Shield, Palette, AlertTriangle } from 'lucide-react';

const Navbar = ({ currentPage, onPageChange, userInfo = { name: 'Admin User', role: 'Operations Manager' } }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const settingsRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: 'selection' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, path: 'alerts' },
  ];

  const settingsMenuItems = [
    { id: 'user-settings', label: 'User Settings', icon: UserCog, path: 'user-settings' },
    { id: 'system-config', label: 'System Configuration', icon: Database, path: 'system-config' },
    { id: 'security', label: 'Security & Permissions', icon: Shield, path: 'security' },
    { id: 'appearance', label: 'Appearance', icon: Palette, path: 'appearance' },
  ];

  const notifications = [
    { id: 1, title: 'ML Simulation Completed', message: 'Train induction analysis finished successfully', time: '2 minutes ago', unread: true },
    { id: 2, title: 'System Maintenance', message: 'Scheduled maintenance completed at 02:00 AM', time: '1 hour ago', unread: true },
    { id: 3, title: 'New Train Data', message: 'Performance metrics updated for 14 trains', time: '3 hours ago', unread: false },
    { id: 4, title: 'Deployment Ready', message: 'Selected trains are ready for deployment', time: '5 hours ago', unread: false },
    { id: 5, title: 'Backup Complete', message: 'Daily data backup completed successfully', time: '1 day ago', unread: false },
  ];

  const handleNavClick = (item) => {
    // Use direct navigation for dashboard to ensure it works from any page
    if (item.id === 'dashboard') {
      window.location.href = '/dashboard';
    } else {
      onPageChange(item.path);
    }
    setIsMenuOpen(false);
  };

  const handleSettingsClick = (item) => {
    onPageChange(item.path);
    setIsSettingsOpen(false);
    setIsMenuOpen(false);
  };

  const toggleSettingsDropdown = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleNotificationsDropdown = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50" style={{ outline: 'none' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16" style={{ outline: 'none' }}>
          {/* Empty space for logo area */}
          <div className="flex items-center space-x-4" style={{ outline: 'none', border: 'none' }}>
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
                      ? 'bg-gray-100 text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
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
                    ? 'bg-gray-100 text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <Settings className="h-4 w-4 transition-transform duration-200 hover:scale-110 hover:rotate-90" />
                <span className="transition-all duration-200">Settings</span>
                <ChevronDown className={`h-3 w-3 transition-all duration-200 hover:scale-110 ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
                              ? 'bg-gray-100 text-gray-900 shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
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

          {/* Right side - User info and notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={toggleNotificationsDropdown}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
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
                <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
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
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                <p className="text-xs text-gray-500">{userInfo.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
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
                        ? 'bg-gray-100 text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                    <span className="transition-all duration-200">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Settings Section */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={toggleSettingsDropdown}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ease-in-out transform hover:scale-102 hover:translate-x-2 ${
                    isSettingsOpen || currentPage.startsWith('settings') || currentPage.startsWith('user-settings') || currentPage.startsWith('system-config') || currentPage.startsWith('security') || currentPage.startsWith('appearance')
                      ? 'bg-gray-100 text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
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
                              ? 'bg-gray-100 text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
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
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-500">{userInfo.role}</p>
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
