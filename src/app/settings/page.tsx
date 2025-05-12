
'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('wagewise-theme') || 'light';
    setCurrentTheme(storedTheme);
    // Theme application is handled in RootLayout

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
      title: "Theme Changed", 
      description: newTheme === 'dark' ? "Switched to dark mode." : "Switched to light mode." 
    });
  };
  
  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setIsDirty(true);
  };

  const handleSaveChanges = () => {
    localStorage.setItem('wagewise-notifications', JSON.stringify(notificationsEnabled));
    setIsDirty(false);
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been saved.",
    });
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
          <CardDescription>Manage your application display and notification settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input 
              id="currency" 
              value={defaultCurrency} 
              onChange={(e) => setDefaultCurrency(e.target.value)} // Though it's disabled, keeping onChange for consistency
              className="max-w-xs"
              placeholder="e.g. INR, USD"
              disabled 
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
              Click "Save Preferences" to apply changes to notifications. Theme is saved instantly.
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

