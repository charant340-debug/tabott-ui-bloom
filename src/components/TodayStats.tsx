import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface StatItem {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface TodayTrackingData {
  taken: number;
  skipped: number;
  to_be_taken: number;
}

const TodayStats: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TodayTrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load today's tracking data
  const loadTodayTrackingData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: tracking, error } = await supabase
        .from('tracking')
        .select('taken, skipped, to_be_taken')
        .eq('date', today);

      if (error) {
        console.error('Error loading today tracking data:', error);
        return null;
      }

      // Sum up all the values for today
      const totalData = tracking?.reduce(
        (acc, record) => ({
          taken: acc.taken + (record.taken || 0),
          skipped: acc.skipped + (record.skipped || 0),
          to_be_taken: acc.to_be_taken + (record.to_be_taken || 0),
        }),
        { taken: 0, skipped: 0, to_be_taken: 0 }
      );

      return totalData || { taken: 0, skipped: 0, to_be_taken: 0 };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await loadTodayTrackingData();
      setTrackingData(data);
      setLoading(false);
    };

    loadData();
  }, []);

  const stats: StatItem[] = [
    {
      label: 'Pills Taken',
      value: loading ? 'Loading...' : (trackingData ? trackingData.taken : 'N/A'),
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Pills Skipped',
      value: loading ? 'Loading...' : (trackingData ? trackingData.skipped : 'N/A'),
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      label: 'Pills Pending',
      value: loading ? 'Loading...' : (trackingData ? trackingData.to_be_taken : 'N/A'),
      icon: <Clock className="h-5 w-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  return (
    <div className="bg-card rounded-lg p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-6">Today's Status</h3>
      
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className={`${stat.bgColor} rounded-lg p-4 transition-all duration-300 hover:scale-105 animate-fade-in`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Today's Progress */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground mb-2">Today's Progress</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-1000 animate-pulse-glow"
              style={{ 
                width: loading ? '0%' : trackingData ? 
                  `${trackingData.taken + trackingData.to_be_taken > 0 ? 
                    Math.round((trackingData.taken / (trackingData.taken + trackingData.to_be_taken)) * 100) : 0}%` : '0%'
              }}
            />
          </div>
          <span className="text-sm font-medium text-primary">
            {loading ? '0%' : trackingData ? 
              `${trackingData.taken + trackingData.to_be_taken > 0 ? 
                Math.round((trackingData.taken / (trackingData.taken + trackingData.to_be_taken)) * 100) : 0}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TodayStats;