import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Plus, Pill, Timer, Calendar, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Reschedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form state
  const [interval, setInterval] = useState("0");
  const [dose1Time, setDose1Time] = useState("08:00");
  const [dose2Time, setDose2Time] = useState("");
  const [dose3Time, setDose3Time] = useState("");
  const [pillsToAdd, setPillsToAdd] = useState("");
  const [snoozeTime, setSnoozeTime] = useState("30 mins");
  const [pillName, setPillName] = useState("");
  const [lastTaken, setLastTaken] = useState("");
  const [loading, setLoading] = useState(true);

  // Load pill data on component mount
  useEffect(() => {
    const loadPillData = async () => {
      if (!id) return;
      
      try {
        const { data: pill, error } = await supabase
          .from('pills')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error loading pill:', error);
          toast({
            title: "Error",
            description: "Failed to load pill data",
            variant: "destructive",
          });
          return;
        }

        if (pill) {
          setPillName(pill.name);
          setInterval(pill.interval_days.toString());
          setDose1Time(pill.dose1_time || "08:00");
          setDose2Time(pill.dose2_time || "");
          setDose3Time(pill.dose3_time || "");
          setPillsToAdd(pill.pills_count?.toString() || "");
          setSnoozeTime(pill.snooze_duration || "30 mins");
          
          // Format last taken time
          if (pill.last_taken_at) {
            const date = new Date(pill.last_taken_at);
            const formatted = date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) + ' – ' + date.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            });
            setLastTaken(formatted);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load pill data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPillData();
  }, [id, toast]);

  const handleSave = async () => {
    if (!id) return;
    
    try {
      const updateData = {
        name: pillName,
        interval_days: parseInt(interval),
        dose1_time: dose1Time || null,
        dose2_time: dose2Time || null,
        dose3_time: dose3Time || null,
        pills_count: pillsToAdd ? parseInt(pillsToAdd) : 0,
        snooze_duration: snoozeTime,
      };

      const { error } = await supabase
        .from('pills')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating pill:', error);
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Pill updated successfully",
      });
      
      navigate(`/pill/${id}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reschedule</h1>
            <p className="text-muted-foreground">{pillName}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Rename Pill */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                Rename Pill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="pillName" className="text-sm font-medium">Pill Name</Label>
                <Input
                  id="pillName"
                  type="text"
                  value={pillName}
                  onChange={(e) => setPillName(e.target.value)}
                  placeholder="Enter pill name"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Interval Selector */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Interval (days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20">
                  <SelectValue placeholder="0-30" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? "Daily (Every day)" : `Every ${i + 1} days`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Daily Dosages */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Daily Dosages
              </CardTitle>
              <p className="text-sm text-muted-foreground">Set up to 3 doses per day</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dose1" className="text-sm font-medium">1st Dose *</Label>
                <Input
                  id="dose1"
                  type="time"
                  value={dose1Time}
                  onChange={(e) => setDose1Time(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dose2" className="text-sm font-medium">2nd Dose (Optional)</Label>
                <Input
                  id="dose2"
                  type="time"
                  value={dose2Time}
                  onChange={(e) => setDose2Time(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dose3" className="text-sm font-medium">3rd Dose (Optional)</Label>
                <Input
                  id="dose3"
                  type="time"
                  value={dose3Time}
                  onChange={(e) => setDose3Time(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Pills to Device */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Pills to Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="pillsAdd" className="text-sm font-medium">Number of pills to add</Label>
                <Input
                  id="pillsAdd"
                  type="number"
                  min="0"
                  max="100"
                  value={pillsToAdd}
                  onChange={(e) => setPillsToAdd(e.target.value)}
                  placeholder="Enter number of pills"
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Snooze Time Selector */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Snooze Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={snoozeTime} onValueChange={setSnoozeTime}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20">
                  <SelectValue placeholder="Select snooze duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 mins">30 minutes</SelectItem>
                  <SelectItem value="1 hr">1 hour</SelectItem>
                  <SelectItem value="1.5 hr">1.5 hours</SelectItem>
                  <SelectItem value="2 hr">2 hours</SelectItem>
                  <SelectItem value="2.5 hr">2.5 hours</SelectItem>
                  <SelectItem value="3 hr">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Last Taken Time - Display Only */}
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Last Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-md p-3 border border-border/20">
                <p className="text-foreground font-medium">{lastTaken}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex-1 border-border/50 hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-primary/25"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reschedule;