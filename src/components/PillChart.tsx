import React, { useState, useEffect } from 'react';
import { format, subDays, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  day: string;
  date: string;
  pillsTaken: number;
  totalScheduled: number;
  isToday: boolean;
}
const PillChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate chart data for the past 7 days (rolling window, today on the right)
  const generateChartData = async (): Promise<ChartData[]> => {
    try {
      const today = new Date();
      
      // Get all user's pills to calculate total scheduled doses
      const { data: pills, error: pillsError } = await supabase
        .from('pills')
        .select('dose1_time, dose2_time, dose3_time');

      if (pillsError) {
        console.error('Error fetching pills:', pillsError);
        return [];
      }

      // Calculate total scheduled doses per day (sum of all non-null dose times)
      const totalScheduledPerDay = pills?.reduce((total, pill) => {
        let doses = 0;
        if (pill.dose1_time) doses++;
        if (pill.dose2_time) doses++;
        if (pill.dose3_time) doses++;
        return total + doses;
      }, 0) || 0;

      const chartDataPromises = Array.from({ length: 7 }, async (_, index) => {
        // Count backwards from today (6 days ago, 5 days ago, ..., today)
        const date = subDays(today, 6 - index);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Get tracking data for this date
        const { data: trackingData, error: trackingError } = await supabase
          .from('tracking')
          .select('taken')
          .eq('date', dateStr);

        if (trackingError) {
          console.error('Error fetching tracking data:', trackingError);
        }

        // Sum all taken pills for this date
        const totalTaken = trackingData?.reduce((sum, record) => sum + (record.taken || 0), 0) || 0;

        return {
          day: format(date, 'EEE'),
          date: format(date, 'd'),
          pillsTaken: totalTaken,
          totalScheduled: totalScheduledPerDay,
          isToday: isToday(date)
        };
      });

      return await Promise.all(chartDataPromises);
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      const data = await generateChartData();
      setChartData(data);
      setLoading(false);
    };

    loadChartData();
  }, []);

  const maxPills = Math.max(...chartData.map(d => d.pillsTaken), 1);

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 h-full border border-border flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <div className="bg-card rounded-lg p-6 h-full border border-border flex flex-col">
      
      
      <div className="flex items-end justify-between flex-1 gap-3">
        {chartData.map((data, index) => {
        const height = data.pillsTaken / maxPills * 100;
        return <div key={`${data.day}-${data.date}`} className="flex-1 flex flex-col items-center group cursor-pointer animate-slide-in-right"
                    style={{ animationDelay: `${index * 50}ms` }}>
              {/* Pill count - always visible */}
              <div className={`text-sm font-bold mb-2 min-h-[20px] flex items-end ${
                data.isToday ? 'text-accent' : 'text-primary'
              }`}>
                {data.pillsTaken}/{data.totalScheduled}
              </div>
              
              {/* Bar Container */}
              <div className="w-full flex flex-col items-center justify-end h-40 relative">
                <div className={`w-full rounded-t-lg transition-all duration-700 hover:from-primary/80 hover:to-primary group-hover:shadow-glow relative overflow-hidden ${
                  data.isToday 
                    ? 'bg-gradient-to-t from-accent/60 to-accent/90' 
                    : 'bg-gradient-to-t from-primary/60 to-primary/90'
                }`} style={{
              height: `${Math.max(height, 8)}%`,
              // Minimum 8% height for visibility
              animationDelay: `${index * 150}ms`
            }}>
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </div>
              
              {/* Day and date labels */}
              <div className="text-center mt-3 space-y-1">
                <div className={`text-sm font-semibold ${
                  data.isToday ? 'text-accent' : 'text-foreground'
                }`}>{data.day}</div>
                <div className={`text-xs px-2 py-1 rounded ${
                  data.isToday 
                    ? 'text-accent bg-accent/10' 
                    : 'text-muted-foreground bg-muted/30'
                }`}>
                  {data.date}
                </div>
              </div>
            </div>;
      })}
      </div>
      
      {/* Chart legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-t from-primary/60 to-primary/90 rounded"></div>
          <span>Pills taken per day</span>
        </div>
      </div>
    </div>;
};
export default PillChart;