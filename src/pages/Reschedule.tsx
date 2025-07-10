import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Plus, Pill, Timer, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Reschedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form state
  const [interval, setInterval] = useState("0");
  const [dose1Time, setDose1Time] = useState("08:00");
  const [dose2Time, setDose2Time] = useState("");
  const [dose3Time, setDose3Time] = useState("");
  const [pillsToAdd, setPillsToAdd] = useState("");
  const [snoozeTime, setSnoozeTime] = useState("30 mins");

  // Mock data for display
  const pillName = "Vitamin D3";
  const lastTaken = "10 Jul 2025 – 14:30";

  const handleSave = () => {
    // Handle save logic here
    console.log("Saving reschedule data:", {
      interval,
      doses: [dose1Time, dose2Time, dose3Time].filter(Boolean),
      pillsToAdd,
      snoozeTime
    });
    navigate(`/pill/${id}`);
  };

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
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Daily (Every day)</SelectItem>
                  <SelectItem value="1">Every 2 days</SelectItem>
                  <SelectItem value="2">Every 3 days</SelectItem>
                  <SelectItem value="3">Every 4 days</SelectItem>
                  <SelectItem value="6">Weekly (Every 7 days)</SelectItem>
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