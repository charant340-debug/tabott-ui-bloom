import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
interface PillChartData {
  day: string;
  date: string;
  pillsTaken: number;
  totalScheduled: number;
}
const pillDetailsData = {
  1: {
    name: 'Vitamin D3',
    pillsLeft: 28,
    lastTaken: '8:00 AM',
    nextIntake: '8:00 AM',
    scheduledDoses: 1
  },
  2: {
    name: 'Omega-3',
    pillsLeft: 15,
    lastTaken: '12:30 PM',
    nextIntake: '12:30 PM',
    scheduledDoses: 2
  },
  3: {
    name: 'Magnesium',
    pillsLeft: 4,
    lastTaken: '9:00 PM',
    nextIntake: '9:00 PM',
    scheduledDoses: 1
  },
  4: {
    name: 'B-Complex',
    pillsLeft: 22,
    lastTaken: '8:00 AM',
    nextIntake: 'Tomorrow 8:00 AM',
    scheduledDoses: 1
  },
  5: {
    name: 'Calcium',
    pillsLeft: 18,
    lastTaken: '7:00 PM',
    nextIntake: '7:00 PM',
    scheduledDoses: 3
  },
  6: {
    name: 'Iron',
    pillsLeft: 2,
    lastTaken: '1:00 PM',
    nextIntake: 'Tomorrow 1:00 PM',
    scheduledDoses: 1
  },
  7: {
    name: 'Zinc',
    pillsLeft: 35,
    lastTaken: '10:00 AM',
    nextIntake: 'Tomorrow 10:00 AM',
    scheduledDoses: 1
  },
  8: {
    name: 'Probiotic',
    pillsLeft: 12,
    lastTaken: '6:00 AM',
    nextIntake: 'Tomorrow 6:00 AM',
    scheduledDoses: 2
  }
};

// Generate dummy chart data for individual pill
const generateChartData = (scheduledDoses: number): PillChartData[] => [{
  day: 'Mon',
  date: '15',
  pillsTaken: Math.min(scheduledDoses, Math.floor(Math.random() * scheduledDoses) + 1),
  totalScheduled: scheduledDoses
}, {
  day: 'Tue',
  date: '16',
  pillsTaken: Math.min(scheduledDoses, Math.floor(Math.random() * scheduledDoses) + 1),
  totalScheduled: scheduledDoses
}, {
  day: 'Wed',
  date: '17',
  pillsTaken: scheduledDoses,
  totalScheduled: scheduledDoses
}, {
  day: 'Thu',
  date: '18',
  pillsTaken: Math.min(scheduledDoses, Math.floor(Math.random() * scheduledDoses) + 1),
  totalScheduled: scheduledDoses
}, {
  day: 'Fri',
  date: '19',
  pillsTaken: Math.min(scheduledDoses, Math.floor(Math.random() * scheduledDoses) + 1),
  totalScheduled: scheduledDoses
}, {
  day: 'Sat',
  date: '20',
  pillsTaken: Math.min(scheduledDoses, Math.floor(Math.random() * scheduledDoses) + 1),
  totalScheduled: scheduledDoses
}, {
  day: 'Sun',
  date: '21',
  pillsTaken: scheduledDoses,
  totalScheduled: scheduledDoses
}];
const PillDetails = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [dynamicSchedule, setDynamicSchedule] = React.useState(true);
  const pillId = parseInt(id || '1');
  const pillData = pillDetailsData[pillId as keyof typeof pillDetailsData];
  if (!pillData) {
    return <div>Pill not found</div>;
  }
  const chartData = generateChartData(pillData.scheduledDoses);
  const maxPills = Math.max(...chartData.map(d => d.pillsTaken));
  const generateScheduleTimes = (doses: number) => {
    const times = ['8:00 AM', '1:00 PM', '8:00 PM'];
    return times.slice(0, doses);
  };
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
                {/* Pills Left Section */}
                <div className="bg-card/50 rounded-lg p-3 border border-border/30 mb-2">
                  <div className="text-sm text-muted-foreground mb-1">Pills Left in Device</div>
                  <div className="text-2xl font-bold text-primary mb-1">{pillData.pillsLeft}</div>
                  <div className={`text-xs font-medium ${pillData.pillsLeft <= 5 ? 'text-destructive' : 'text-success'}`}>
                    {pillData.pillsLeft <= 5 ? 'Low Stock - Refill Soon' : 'Stock Level Good'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Next Intake</div>
                <div className="text-lg font-semibold text-primary mb-2">{pillData.nextIntake}</div>
                <div className="text-sm text-muted-foreground">
                  Last Taken: <span className="text-foreground font-medium">{pillData.lastTaken}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Schedule Toggle */}
            <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg border border-border/20 mb-6">
              <div>
                <div className="font-medium text-foreground">Dynamic Schedule</div>
                <div className="text-sm text-muted-foreground">Automatically adjust timing based on habits</div>
              </div>
              <Switch checked={dynamicSchedule} onCheckedChange={setDynamicSchedule} />
            </div>

            {/* Daily Schedule */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground mb-4">Today's Schedule</h3>
              {generateScheduleTimes(pillData.scheduledDoses).map((time, index) => (
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
        </div>
      </main>
    </div>;
};
export default PillDetails;