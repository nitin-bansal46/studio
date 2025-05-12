'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

// Simple translation helper
const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "Application Settings",
    pageDescription: "Configure general settings and preferences for WageWise.",
    preferencesCardTitle: "Preferences",
    preferencesCardDescription: "Manage your application display and language settings.",
    defaultCurrencyLabel: "Default Currency",
    defaultCurrencyDescription: "Default currency for salary display (currently fixed to INR).",
    darkModeLabel: "Dark Mode",
    darkModeDescription: "Toggle between light and dark themes for the application. Theme is saved automatically.",
    languageLabel: "Application Language",
    languageDescription: "Choose your preferred language. Hindi support is illustrative.",
    notificationsLabel: "Enable Notifications",
    notificationsDescription: "Toggle application-wide notifications (feature placeholder).",
    saveButton: "Save Preferences",
    saveButtonDescription: "Click \"Save Preferences\" to apply changes to language and notifications. Theme is saved instantly.",
    dataManagementCardTitle: "Data Management",
    dataManagementCardDescription: "Manage your application data (placeholder features).",
    exportDataButton: "Export Data",
    exportDataDescription: "Export all worker and attendance data (placeholder).",
    clearDataButton: "Clear All Data",
    clearDataDescription: "Permanently delete all application data (placeholder, use with caution).",
    themeChangedToastTitle: "Theme Changed",
    themeChangedToastDescriptionDark: "Switched to dark mode.",
    themeChangedToastDescriptionLight: "Switched to light mode.",
    preferencesSavedToastTitle: "Preferences Saved",
    preferencesSavedToastDescription: "Your language and notification settings have been saved.",
    hindiSelectedAlert: "हिन्दी भाषा का चयन किया गया है (यह एक उदाहरण है, पूर्ण स्थानीयकरण लागू नहीं किया गया है)।",
    englishSelectedAlert: "English language selected (this is illustrative, full localization is not implemented).",
  },
  hi: {
    pageTitle: "एप्लिकेशन सेटिंग्स",
    pageDescription: "WageWise के लिए सामान्य सेटिंग्स और वरीयताएँ कॉन्फ़िगर करें।",
    preferencesCardTitle: "वरीयताएँ",
    preferencesCardDescription: "अपने एप्लिकेशन डिस्प्ले और भाषा सेटिंग्स प्रबंधित करें।",
    defaultCurrencyLabel: "डिफ़ॉल्ट मुद्रा",
    defaultCurrencyDescription: "वेतन प्रदर्शन के लिए डिफ़ॉल्ट मुद्रा (वर्तमान में INR पर निर्धारित)।",
    darkModeLabel: "डार्क मोड",
    darkModeDescription: "एप्लिकेशन के लिए लाइट और डार्क थीम के बीच टॉगल करें। थीम स्वचालित रूप से सहेजी जाती है।",
    languageLabel: "एप्लिकेशन भाषा",
    languageDescription: "अपनी पसंदीदा भाषा चुनें। हिन्दी समर्थन उदाहरणात्मक है।",
    notificationsLabel: "सूचनाएं सक्षम करें",
    notificationsDescription: "एप्लिकेशन-व्यापी सूचनाएं टॉगल करें (सुविधा प्लेसहोल्डर)।",
    saveButton: "वरीयताएँ सहेजें",
    saveButtonDescription: "भाषा और सूचनाओं में परिवर्तन लागू करने के लिए \"वरीयताएँ सहेजें\" पर क्लिक करें। थीम तुरन्त सहेजी जाती है।",
    dataManagementCardTitle: "डेटा प्रबंधन",
    dataManagementCardDescription: "अपना एप्लिकेशन डेटा प्रबंधित करें (प्लेसहोल्डर सुविधाएँ)।",
    exportDataButton: "डेटा निर्यात करें",
    exportDataDescription: "सभी कार्यकर्ता और उपस्थिति डेटा निर्यात करें (प्लेसहोल्डर)।",
    clearDataButton: "सारा डेटा साफ़ करें",
    clearDataDescription: "सभी एप्लिकेशन डेटा स्थायी रूप से हटाएं (प्लेसहोल्डर, सावधानी से उपयोग करें)।",
    themeChangedToastTitle: "थीम बदली गई",
    themeChangedToastDescriptionDark: "डार्क मोड पर स्विच किया गया।",
    themeChangedToastDescriptionLight: "लाइट मोड पर स्विच किया गया।",
    preferencesSavedToastTitle: "वरीयताएँ सहेजी गईं",
    preferencesSavedToastDescription: "आपकी भाषा और सूचना सेटिंग्स सहेज ली गई हैं।",
    hindiSelectedAlert: "हिन्दी भाषा का चयन किया गया है (यह एक उदाहरण है, पूर्ण स्थानीयकरण लागू नहीं किया गया है)।",
    englishSelectedAlert: "English language selected (this is illustrative, full localization is not implemented).",
  }
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isDirty, setIsDirty] = useState(false);

  const t = translations[selectedLanguage] || translations.en;

  useEffect(() => {
    const storedTheme = localStorage.getItem('wagewise-theme') || 'light';
    setCurrentTheme(storedTheme);
    // Theme application is handled in RootLayout

    const storedLanguage = localStorage.getItem('wagewise-language') || 'en';
    setSelectedLanguage(storedLanguage);

    const storedNotifications = localStorage.getItem('wagewise-notifications');
    if (storedNotifications !== null) {
      setNotificationsEnabled(JSON.parse(storedNotifications));
    }
    setIsDirty(false); 
  }, []);

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('wagewise-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast({ 
      title: t.themeChangedToastTitle, 
      description: newTheme === 'dark' ? t.themeChangedToastDescriptionDark : t.themeChangedToastDescriptionLight 
    });
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setIsDirty(true);
  };
  
  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setIsDirty(true);
  };

  const handleSaveChanges = () => {
    localStorage.setItem('wagewise-language', selectedLanguage);
    localStorage.setItem('wagewise-notifications', JSON.stringify(notificationsEnabled));
    setIsDirty(false);
    toast({
      title: t.preferencesSavedToastTitle,
      description: t.preferencesSavedToastDescription,
    });
    if (selectedLanguage === 'hi') {
        alert(t.hindiSelectedAlert);
    } else if (selectedLanguage === 'en') {
        alert(t.englishSelectedAlert);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title={t.pageTitle}
        description={t.pageDescription}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.preferencesCardTitle}</CardTitle>
          <CardDescription>{t.preferencesCardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">{t.defaultCurrencyLabel}</Label>
            <Input 
              id="currency" 
              value={defaultCurrency} 
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="max-w-xs"
              placeholder="e.g. INR, USD"
              disabled 
            />
            <p className="text-xs text-muted-foreground">
              {t.defaultCurrencyDescription}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="theme-toggle" 
              checked={currentTheme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
            <Label htmlFor="theme-toggle" className="flex items-center">
              {currentTheme === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              {t.darkModeLabel}
            </Label>
          </div>
           <p className="text-xs text-muted-foreground -mt-4 ml-[3.25rem]">
              {t.darkModeDescription}
            </p>

          <div className="space-y-2">
            <Label htmlFor="language-select">{t.languageLabel}</Label>
             <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            <p className="text-xs text-muted-foreground">
              {t.languageDescription}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications" 
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
            <Label htmlFor="notifications">{t.notificationsLabel}</Label>
          </div>
           <p className="text-xs text-muted-foreground -mt-4 ml-[3.25rem]">
              {t.notificationsDescription}
            </p>

          <div>
            <Button onClick={handleSaveChanges} disabled={!isDirty}>
              {t.saveButton}
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
              {t.saveButtonDescription}
            </p>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle>{t.dataManagementCardTitle}</CardTitle>
            <CardDescription>{t.dataManagementCardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Button variant="outline" disabled>{t.exportDataButton}</Button>
                <p className="text-xs text-muted-foreground mt-1">{t.exportDataDescription}</p>
            </div>
            <div>
                <Button variant="destructive" disabled>{t.clearDataButton}</Button>
                <p className="text-xs text-muted-foreground mt-1">{t.clearDataDescription}</p>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
