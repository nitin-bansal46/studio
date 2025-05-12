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

export default function SettingsPage() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isDirty, setIsDirty] = useState(false);

  // Load initial settings from localStorage
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
    setIsDirty(false); // Reset dirty state after loading
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
    toast({ title: "Theme Changed", description: `Switched to ${newTheme} mode.` });
    // Theme changes are instant, so not marking as dirty for "Save" button
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setIsDirty(true);
    // Placeholder for actual language change logic
    // alert(`Language selection changed to ${lang}. Click 'Save Preferences' to apply (illustrative).`);
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
      title: "Preferences Saved",
      description: "Your language and notification settings have been saved (illustrative).",
    });
    if (selectedLanguage === 'hi') {
        alert("हिन्दी भाषा का चयन किया गया है (यह एक उदाहरण है, पूर्ण स्थानीयकरण लागू नहीं किया गया है)।");
    } else if (selectedLanguage === 'en') {
        alert("English language selected (this is illustrative, full localization is not implemented).");
    }
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
              Toggle between light and dark themes for the application. Theme is saved automatically.
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
              Choose your preferred language. Hindi support is illustrative.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="notifications" 
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
            <Label htmlFor="notifications">Enable Notifications</Label>
          </div>
           <p className="text-xs text-muted-foreground -mt-4 ml-[3.25rem]">
              Toggle application-wide notifications (feature placeholder).
            </p>

          <div>
            <Button onClick={handleSaveChanges} disabled={!isDirty}>
              Save Preferences
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
              Click "Save Preferences" to apply changes to language and notifications. Theme is saved instantly.
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
