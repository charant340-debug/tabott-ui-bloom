import React from 'react';
interface ChartData {
  day: string;
  date: string;
  pillsTaken: number;
  totalScheduled: number;
}
const chartData: ChartData[] = [{
  day: 'Mon',
  date: '15',
  pillsTaken: 6,
  totalScheduled: 8
}, {
  day: 'Tue',
  date: '16',
  pillsTaken: 4,
  totalScheduled: 8
}, {
  day: 'Wed',
  date: '17',
  pillsTaken: 8,
  totalScheduled: 8
}, {
  day: 'Thu',
  date: '18',
  pillsTaken: 5,
  totalScheduled: 8
}, {
  day: 'Fri',
  date: '19',
  pillsTaken: 7,
  totalScheduled: 8
}, {
  day: 'Sat',
  date: '20',
  pillsTaken: 3,
  totalScheduled: 6
}, {
  day: 'Sun',
  date: '21',
  pillsTaken: 6,
  totalScheduled: 8
}];
const PillChart: React.FC = () => {
  const maxPills = Math.max(...chartData.map(d => d.pillsTaken));
  return <div className="bg-card rounded-lg p-6 h-full border border-border flex flex-col">
      
      
      <div className="flex items-end justify-between flex-1 gap-3">
        {chartData.map((data, index) => {
        const height = data.pillsTaken / maxPills * 100;
        return <div key={data.day} className="flex-1 flex flex-col items-center group cursor-pointer">
              {/* Pill count - always visible */}
              <div className="text-sm font-bold text-primary mb-2 min-h-[20px] flex items-end">
                {data.pillsTaken}/{data.totalScheduled}
              </div>
              
              {/* Bar Container */}
              <div className="w-full flex flex-col items-center justify-end h-40 relative">
                <div className="w-full bg-gradient-to-t from-primary/60 to-primary/90 rounded-t-lg transition-all duration-700 hover:from-primary/80 hover:to-primary group-hover:shadow-glow relative overflow-hidden" style={{
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
                <div className="text-sm font-semibold text-foreground">{data.day}</div>
                <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
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