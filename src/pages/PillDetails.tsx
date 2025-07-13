import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PillChartData {
  day: string;
  date: string;
  pillsTaken: number;
  totalScheduled: number;
}

interface PillData {
  id: string;
  name: string;
  pillsLeft: number;
  lastTaken?: string;
  nextIntake: string;
  scheduledDoses: number;
  dose1_time?: string;
  dose2_time?: string;
  dose3_time?: string;
}
// Generate dummy chart data for individual pill
const generateChartData = (scheduledDoses: number): PillChartData[] => [{
  day: 'Mon',
  date: '15',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}, {
  day: 'Tue',
  date: '16',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}, {
  day: 'Wed',
  date: '17',
  pillsTaken: scheduledDoses,
  totalScheduled: scheduledDoses
}, {
  day: 'Thu',
  date: '18',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}, {
  day: 'Fri',
  date: '19',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}, {
  day: 'Sat',
  date: '20',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}, {
  day: 'Sun',
  date: '21',
  pillsTaken: Math.floor(Math.random() * scheduledDoses) + 1,
  totalScheduled: scheduledDoses
}];

const PillDetails = () => {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dynamicSchedule, setDynamicSchedule] = useState(true);
  const [pillData, setPillData] = useState<PillData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load pill data on component mount
  useEffect(() => {
    const loadPillData = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No pill ID provided",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      try {
        const { data: pill, error } = await supabase
          .from('pills')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error loading pill:', error);
          toast({
            title: "Error",
            description: "Failed to load pill data",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (!pill) {
          toast({
            title: "Error", 
            description: "Pill not found",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Calculate scheduled doses
        let scheduledDoses = 0;
        if (pill.dose1_time) scheduledDoses++;
        if (pill.dose2_time) scheduledDoses++;
        if (pill.dose3_time) scheduledDoses++;

        // Format last taken time
        let lastTaken = '';
        if (pill.last_taken_at) {
          const date = new Date(pill.last_taken_at);
          lastTaken = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        // Calculate next intake
        let nextIntake = 'Not scheduled';
        if (pill.dose1_time) {
          nextIntake = pill.dose1_time;
        }

        setPillData({
          id: pill.id,
          name: pill.name,
          pillsLeft: pill.pills_count || 0,
          lastTaken,
          nextIntake,
          scheduledDoses,
          dose1_time: pill.dose1_time,
          dose2_time: pill.dose2_time,
          dose3_time: pill.dose3_time,
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load pill data",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPillData();
    window.scrollTo(0, 0);
  }, [id, toast, navigate]);

  const generateScheduleTimes = () => {
    if (!pillData) return [];
    
    const times = [];
    if (pillData.dose1_time) times.push(pillData.dose1_time);
    if (pillData.dose2_time) times.push(pillData.dose2_time);
    if (pillData.dose3_time) times.push(pillData.dose3_time);
    
    return times;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!pillData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Pill not found</div>
      </div>
    );
  }

  const chartData = generateChartData(pillData.scheduledDoses);
  const maxPills = Math.max(...chartData.map(d => d.pillsTaken));
  return <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Pill className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {pillData.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Top Section - Fixed Chart */}
      <section className="fixed top-16 left-0 right-0 h-80 bg-background border-b border-border z-40">
        <div className="container mx-auto px-6 py-6 h-full">
          <div className="bg-card rounded-lg p-6 h-full border border-border">
            
            
            <div className="flex items-end justify-between flex-1 gap-3 h-48">
              {chartData.map((data, index) => {
              const height = data.pillsTaken / maxPills * 100;
              return <div key={data.day} className="flex-1 flex flex-col items-center group cursor-pointer">
                    {/* Pill count - always visible */}
                    <div className="text-sm font-bold text-primary mb-2 min-h-[20px] flex items-end">
                      {data.pillsTaken}/{data.totalScheduled}
                    </div>
                    
                    {/* Bar Container */}
                    <div className="w-full flex flex-col items-center justify-end h-32 relative">
                      <div className="w-full bg-gradient-to-t from-primary/60 to-primary/90 rounded-t-lg transition-all duration-700 hover:from-primary/80 hover:to-primary group-hover:shadow-glow relative overflow-hidden" style={{
                    height: `${Math.max(height, 8)}%`,
                    animationDelay: `${index * 150}ms`
                  }}>
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      </div>
                    </div>
                    
                    {/* Day and date labels */}
                    <div className="text-center mt-3 space-y-1">
                      <div className="text-sm font-semibold text-foreground">{data.day}</div>
                      <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                        {data.date} Jul
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section - Scrollable Content */}
      <main className="pt-96 pb-8">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-xl p-6 border border-border/50 backdrop-blur-sm">
            
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-3">{pillData.name}</h2>
                {/* Pills Left and Today's Status */}
                <div className="flex gap-3">
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30 flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Pills Left in Device</div>
                    <div className="text-2xl font-bold text-primary mb-1">{pillData.pillsLeft}</div>
                    <div className={`text-xs font-medium ${pillData.pillsLeft <= 5 ? 'text-destructive' : 'text-success'}`}>
                      {pillData.pillsLeft <= 5 ? 'Low Stock - Refill Soon' : 'Stock Level Good'}
                    </div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30 flex-1">
                    <div className="text-sm text-muted-foreground mb-2 font-medium">Today's Status</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80 font-medium">Taken</span>
                        <span className="text-success font-semibold">2</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80 font-medium">To Take</span>
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/80 font-medium">Skipped</span>
                        <span className="text-foreground/60 font-semibold">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Next Intake</div>
                <div className="text-lg font-semibold text-primary">{pillData.nextIntake}</div>
              </div>
            </div>

            {/* Last Taken positioned at bottom right */}
            <div className="flex justify-end mb-6">
              <div className="text-sm text-muted-foreground">
                Last Taken: <span className="text-foreground font-medium">{pillData.lastTaken}</span>
              </div>
            </div>

            {/* Daily Schedule */}
            <div className="mt-6 pt-6 border-t border-border/20">
              <h3 className="text-lg font-semibold text-foreground mb-4">Schedule</h3>
              <div className="space-y-3">
                {generateScheduleTimes().map((time, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card/20 rounded-lg border border-border/10">
                    <div>
                      <div className="font-medium text-foreground">
                        {index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Dose
                      </div>
                      <div className="text-sm text-muted-foreground">Daily medication</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{time}</div>
                      <div className="text-xs text-muted-foreground">Today, Jul 21</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Schedule Toggle */}
            <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg border border-border/20 mt-6 mb-6">
              <div>
                <div className="font-medium text-foreground">Dynamic Schedule</div>
                <div className="text-sm text-muted-foreground">Automatically adjust timing based on habits</div>
              </div>
              <Switch checked={dynamicSchedule} onCheckedChange={setDynamicSchedule} />
            </div>

            {/* Reschedule Button */}
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => navigate(`/pill/${id}/reschedule`)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-elegant"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default PillDetails;