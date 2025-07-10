import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TodayStats: React.FC = () => {
  const stats: StatItem[] = [
    {
      label: 'Pills Taken',
      value: 6,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Pills Skipped',
      value: 1,
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      label: 'Pills Pending',
      value: 2,
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
              style={{ width: '67%' }}
            />
          </div>
          <span className="text-sm font-medium text-primary">67%</span>
        </div>
      </div>
    </div>
  );
};

export default TodayStats;