import React from 'react';

interface ChartData {
  day: string;
  date: string;
  pillsTaken: number;
}

const chartData: ChartData[] = [
  { day: 'Mon', date: '15', pillsTaken: 6 },
  { day: 'Tue', date: '16', pillsTaken: 4 },
  { day: 'Wed', date: '17', pillsTaken: 8 },
  { day: 'Thu', date: '18', pillsTaken: 5 },
  { day: 'Fri', date: '19', pillsTaken: 7 },
  { day: 'Sat', date: '20', pillsTaken: 3 },
  { day: 'Sun', date: '21', pillsTaken: 6 },
];

const PillChart: React.FC = () => {
  const maxPills = Math.max(...chartData.map(d => d.pillsTaken));

  return (
    <div className="bg-card rounded-lg p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-6">7-Day Pill Intake</h3>
      
      <div className="flex items-end justify-between h-64 gap-2">
        {chartData.map((data, index) => {
          const height = (data.pillsTaken / maxPills) * 100;
          
          return (
            <div key={data.day} className="flex-1 flex flex-col items-center group">
              {/* Pill count at top of bar */}
              <div className="text-sm font-medium text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {data.pillsTaken}
              </div>
              
              {/* Bar */}
              <div className="w-full flex flex-col items-center justify-end flex-1 relative">
                <div
                  className="w-full bg-gradient-to-t from-primary/60 to-primary/80 rounded-t-md transition-all duration-500 hover:from-primary/80 hover:to-primary group-hover:shadow-glow cursor-pointer"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              
              {/* Day and date */}
              <div className="text-center mt-2">
                <div className="text-xs font-medium text-muted-foreground">{data.day}</div>
                <div className="text-xs text-muted-foreground/70">{data.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PillChart;