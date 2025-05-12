'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { GearIcon } from '@radix-ui/react-icons'; // Example, using Lucide instead
import { Moon, Sun, Languages } from 'lucide-react'; // Icons for theme toggle

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const storedTheme = localStorage.getItem('wagewise-theme') || 'light';
    setCurrentTheme(storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const storedLanguage = localStorage.getItem('wagewise-language') || 'en';
    setSelectedLanguage(storedLanguage);
    // Add logic here to actually change language if i18n is implemented
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
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('wagewise-language', lang);
    // Placeholder: Actual language change would require i18n library and reload or dynamic content update.
    alert(`Language changed to ${lang}. Full internationalization support is not yet implemented.`);
  };


  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title="Application Settings"
        description="Configure general settings and preferences for WageWise."
      />

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application display and language settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input 
              id="currency" 
              value={defaultCurrency} 
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="max-w-xs"
              placeholder="e.g. INR, USD"
              disabled // Currency is fixed to INR for now
            />
            <p className="text-xs text-muted-foreground">
              Default currency for salary display (currently fixed to INR).
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
              Dark Mode
            </Label>
          </div>
           <p className="text-xs text-muted-foreground -mt-4 ml-[3.25rem]">
              Toggle between light and dark themes for the application.
            </p>

          <div className="space-y-2">
            <Label htmlFor="language-select">Application Language</Label>
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
              Choose your preferred language (Hindi support is a placeholder).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications" 
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
            <Label htmlFor="notifications">Enable Notifications</Label>
          </div>
           <p className="text-xs text-muted-foreground -mt-4 ml-[3.25rem]">
              Toggle application-wide notifications (feature placeholder).
            </p>

          <div>
            <Button disabled> {/* Placeholder action */}
              Save Preferences
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
              Preferences like theme and language are saved automatically. Other settings are illustrative.
            </p>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your application data (placeholder features).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Button variant="outline" disabled>Export Data</Button>
                <p className="text-xs text-muted-foreground mt-1">Export all worker and attendance data (placeholder).</p>
            </div>
            <div>
                <Button variant="destructive" disabled>Clear All Data</Button>
                <p className="text-xs text-muted-foreground mt-1">Permanently delete all application data (placeholder, use with caution).</p>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
