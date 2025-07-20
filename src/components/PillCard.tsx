import React, { useState, useEffect } from 'react';
import { Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface PillCardProps {
  pillId: string;
  pillName: string;
  pillsLeft: number;
  lastTaken?: string;
  nextIntake: string;
  index: number;
}

const PillCard: React.FC<PillCardProps> = ({ 
  pillId,
  pillName, 
  pillsLeft, 
  nextIntake, 
  index 
}) => {
  const navigate = useNavigate();
  const isLowStock = pillsLeft <= 5;
  const [lastTakenData, setLastTakenData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch last taken data from tracking table
  const fetchLastTaken = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLastTakenData(null);
        return;
      }

      const { data: tracking, error } = await supabase
        .from('tracking')
        .select('third_intake, second_intake, first_intake, date')
        .eq('id', pillId)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last taken data:', error);
        setLastTakenData(null);
        return;
      }

      if (!tracking || tracking.length === 0) {
        setLastTakenData(null);
        return;
      }

      const record = tracking[0];
      
      // Check third_intake first, then second_intake, then first_intake
      let lastIntake = null;
      if (record.third_intake) {
        lastIntake = record.third_intake;
      } else if (record.second_intake) {
        lastIntake = record.second_intake;
      } else if (record.first_intake) {
        lastIntake = record.first_intake;
      }

      if (lastIntake) {
        const formattedTime = format(new Date(lastIntake), 'MMM dd, HH:mm');
        setLastTakenData(formattedTime);
      } else {
        setLastTakenData(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setLastTakenData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastTaken();
  }, [pillId]);
  
  const handleClick = () => {
    navigate(`/pill/${pillId}`);
  };
  
  return (
    <div 
      className="bg-gradient-pill-card backdrop-blur-sm rounded-lg p-6 border border-border/50 transition-all duration-300 hover:scale-105 hover:shadow-card animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-foreground truncate pr-2">
          {pillName}
        </h3>
        {!loading && (lastTakenData || lastTakenData === null) && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Last Taken</div>
            <div className="text-sm font-medium text-secondary">{lastTakenData || 'N/A'}</div>
          </div>
        )}
      </div>

      {/* Pills Left - Center Focus */}
      <div className="flex items-center gap-3 mb-4">
        <Package className={`h-6 w-6 ${isLowStock ? 'text-destructive' : 'text-primary'}`} />
        <div>
          <div className="text-sm text-muted-foreground">Pills Left</div>
          <div className={`text-3xl font-bold ${isLowStock ? 'text-destructive' : 'text-primary'}`}>
            {pillsLeft}
          </div>
        </div>
        {isLowStock && (
          <div className="ml-auto">
            <span className="bg-destructive/20 text-destructive px-2 py-1 rounded-full text-xs font-medium">
              Low Stock
            </span>
          </div>
        )}
      </div>

      {/* Next Intake */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <div className="text-sm text-muted-foreground">Next Intake</div>
        </div>
        <div className="text-sm font-medium text-accent">{nextIntake}</div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-destructive animate-pulse' : 'bg-success'}`} />
          <span className="text-xs text-muted-foreground">
            {isLowStock ? 'Refill Needed' : 'Stock OK'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PillCard;