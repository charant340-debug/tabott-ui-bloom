import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wifi, Key, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Setup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    device_id: '',
    ssid: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.device_id || !formData.ssid || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to setup a device');
      return;
    }

    setLoading(true);

    try {
      // Call the edge function to send the setup message
      const { data, error } = await supabase.functions.invoke('device-setup', {
        body: {
          device_id: formData.device_id,
          user_id: user.id,
          ssid: formData.ssid,
          password: formData.password
        }
      });

      if (error) {
        console.error('Setup error:', error);
        toast.error('Failed to setup device. Please try again.');
        return;
      }

      toast.success('Device setup message sent successfully!');
      
      // Reset form
      setFormData({
        device_id: '',
        ssid: '',
        password: ''
      });

    } catch (error) {
      console.error('Setup error:', error);
      toast.error('An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border"></div>
            <h1 className="text-xl font-semibold text-foreground">Device Setup</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 py-8">
        <div className="container mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Link Your Device</CardTitle>
              <CardDescription>
                Connect your smart pill dispenser to your account by providing the device credentials and WiFi settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="device_id" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device ID
                  </Label>
                  <Input
                    id="device_id"
                    name="device_id"
                    type="text"
                    placeholder="Enter your device ID"
                    value={formData.device_id}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-200 focus:scale-105"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find the device ID on the label of your pill dispenser
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssid" className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    WiFi Network (SSID)
                  </Label>
                  <Input
                    id="ssid"
                    name="ssid"
                    type="text"
                    placeholder="Enter your WiFi network name"
                    value={formData.ssid}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-200 focus:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    WiFi Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your WiFi password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-200 focus:scale-105"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full transition-all duration-200 hover:scale-105"
                  disabled={loading}
                >
                  {loading ? 'Setting up device...' : 'Setup Device'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Setup;