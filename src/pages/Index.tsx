import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PillChart from '../components/PillChart';
import TodayStats from '../components/TodayStats';
import PillCard from '../components/PillCard';

interface PillData {
  id: number;
  name: string;
  pillsLeft: number;
  lastTaken?: string;
  nextIntake: string;
}

const pillsData: PillData[] = [
  { id: 1, name: 'Vitamin D3', pillsLeft: 28, lastTaken: '8:00 AM', nextIntake: '8:00 AM' },
  { id: 2, name: 'Omega-3', pillsLeft: 15, lastTaken: '12:30 PM', nextIntake: '12:30 PM' },
  { id: 3, name: 'Magnesium', pillsLeft: 4, lastTaken: '9:00 PM', nextIntake: '9:00 PM' },
  { id: 4, name: 'B-Complex', pillsLeft: 22, lastTaken: '8:00 AM', nextIntake: 'Tomorrow 8:00 AM' },
  { id: 5, name: 'Calcium', pillsLeft: 18, lastTaken: '7:00 PM', nextIntake: '7:00 PM' },
  { id: 6, name: 'Iron', pillsLeft: 2, lastTaken: '1:00 PM', nextIntake: 'Tomorrow 1:00 PM' },
  { id: 7, name: 'Zinc', pillsLeft: 35, lastTaken: '10:00 AM', nextIntake: 'Tomorrow 10:00 AM' },
  { id: 8, name: 'Probiotic', pillsLeft: 12, lastTaken: '6:00 AM', nextIntake: 'Tomorrow 6:00 AM' }
];

const Index = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Pill className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TABOTT
            </h1>
            <span className="text-sm text-muted-foreground ml-2">Smart Pill Reminder</span>
            
            {/* User Menu */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 border border-border">
                    <User className="h-4 w-4" />
                    <span>Menu</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Top Section - Fixed Height Chart Area */}
        <section className="h-96 px-6 py-6 bg-background border-b border-border relative z-20 mb-32">
          <div className="container mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              {/* Chart - 3/4 width */}
              <div className="lg:col-span-3">
                <PillChart />
              </div>
              
              {/* Stats - 1/4 width */}
              <div className="lg:col-span-1">
                <TodayStats />
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section - Pill Cards */}
        <section className="px-6 py-8 relative z-10 bg-background mt-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pillsData.map((pill, index) => (
              <PillCard
                key={pill.id}
                pillId={pill.id}
                pillName={pill.name}
                pillsLeft={pill.pillsLeft}
                lastTaken={pill.lastTaken}
                nextIntake={pill.nextIntake}
                index={index}
              />
            ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
