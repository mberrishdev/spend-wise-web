
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface MonthlyPeriod {
  startDay: number;
  endDay: number;
}

export const Settings = () => {
  const [startDay, setStartDay] = useState(25);
  const [endDay, setEndDay] = useState(24);

  useEffect(() => {
    const savedPeriod = localStorage.getItem("spendwise-monthly-period");
    if (savedPeriod) {
      const period: MonthlyPeriod = JSON.parse(savedPeriod);
      setStartDay(period.startDay);
      setEndDay(period.endDay);
    }
  }, []);

  const savePeriod = () => {
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      toast({
        title: "Invalid day range",
        description: "Days must be between 1 and 31",
        variant: "destructive",
      });
      return;
    }

    const period: MonthlyPeriod = { startDay, endDay };
    localStorage.setItem("spendwise-monthly-period", JSON.stringify(period));
    
    toast({
      title: "Monthly period saved! 🎉",
      description: `Your budget month now runs from ${startDay}th to ${endDay}th`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            ⚙️ Monthly Period Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure when your budget month starts and ends
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-day">Budget month starts on day:</Label>
              <Input
                id="start-day"
                type="number"
                min="1"
                max="31"
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <p className="text-xs text-gray-600">
                e.g., 25 = 25th of each month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-day">Budget month ends on day:</Label>
              <Input
                id="end-day"
                type="number"
                min="1"
                max="31"
                value={endDay}
                onChange={(e) => setEndDay(parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <p className="text-xs text-gray-600">
                e.g., 24 = 24th of next month
              </p>
            </div>

            <Button onClick={savePeriod} className="w-full bg-purple-600 hover:bg-purple-700">
              Save Monthly Period
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Current Period:</h4>
            <p className="text-sm text-gray-600">
              Your budget month runs from the <strong>{startDay}th</strong> of each month 
              to the <strong>{endDay}th</strong> of the following month.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Example: June 25th → July 24th
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
