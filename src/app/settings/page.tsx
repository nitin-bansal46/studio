'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GearIcon } from '@radix-ui/react-icons'; // Example, ensure this or similar is available or use Lucide

export default function SettingsPage() {
  // Placeholder state for settings
  // In a real app, these would come from localStorage or a backend
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [defaultCurrency, setDefaultCurrency] = React.useState('USD');

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <PageHeader
        title="Application Settings"
        description="Configure general settings for WageWise."
      />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input 
              id="currency" 
              value={defaultCurrency} 
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="max-w-xs"
              placeholder="e.g. USD, INR"
            />
            <p className="text-xs text-muted-foreground">
              Set the default currency for salary display.
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
              Save Settings 
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
              Settings are illustrative and not functional in this version.
            </p>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle>Data Management</CardTitle>
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

import React from 'react'; // Added React import to satisfy linter for useState
