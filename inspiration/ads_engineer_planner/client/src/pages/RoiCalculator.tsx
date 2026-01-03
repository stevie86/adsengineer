import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Calculator, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoiCalculator() {
  const { isAuthenticated } = useAuth();
  const { data: roiParams } = trpc.roi.getParameters.useQuery(undefined, { enabled: isAuthenticated });
  const updateRoiMutation = trpc.roi.updateParameters.useMutation();

  // URL Params for Customer Context
  const searchParams = new URLSearchParams(window.location.search);
  const customerId = searchParams.get("customerId");
  const customerName = searchParams.get("customerName");
  const currentFee = searchParams.get("currentFee");

  const [monthlyRevenue, setMonthlyRevenue] = useState(10000000); // Default to 100k EUR (in cents)
  const [monthlyAdBudget, setMonthlyAdBudget] = useState(5000000); // Default to 50k EUR (in cents)
  const [lossMin, setLossMin] = useState(25); // Default to 25% based on user example
  const [lossMax, setLossMax] = useState(35);
  const [fee, setFee] = useState(currentFee ? Number(currentFee) : 50000); // Default to 500 EUR (in cents)
  const [autoPricing, setAutoPricing] = useState(true);

  // Load data from database
  useEffect(() => {
    if (roiParams) {
      setMonthlyRevenue(roiParams.monthlyRevenue);
      setMonthlyAdBudget(roiParams.monthlyAdBudget);
      setLossMin(roiParams.lossScenarioMin);
      setLossMax(roiParams.lossScenarioMax);
      setFee(roiParams.adsEngineerFee);
    }
  }, [roiParams]);

  // Dynamic Pricing Logic
  // Dynamic Pricing Logic
  useEffect(() => {
    if (autoPricing) {
      // Logic: "Add Revenue + AdSpend + Estimated Recoverable Loss"
      // We interpret this as a pricing formula that takes a share of the total value volume.
      // Fee = (Revenue * 0.1%) + (AdSpend * 1%) + (RecoveredLoss * 5%)

      const wastedSpend = (monthlyAdBudget * lossMin) / 100;

      const revenueShare = monthlyRevenue * 0.001; // 0.1%
      const adSpendShare = monthlyAdBudget * 0.01; // 1%
      const recoveryShare = wastedSpend * 0.05; // 5%

      const calculatedFee = revenueShare + adSpendShare + recoveryShare;

      // Smoother rounding: round to nearest 10 EUR (1000 cents)
      const roundedFee = Math.round(calculatedFee / 1000) * 1000;
      setFee(Math.max(roundedFee, 9900)); // Minimum 99 EUR
    }
  }, [monthlyRevenue, monthlyAdBudget, lossMin, autoPricing]);


  // Calculations
  const wastedSpend = (monthlyAdBudget * lossMin) / 100;
  const efficiencyGained = wastedSpend; // Same value, framed differently

  const savedRevenueMin = (monthlyRevenue * lossMin) / 100;
  // Break-even Analysis
  const setupFee = 19900; // 199 EUR standard setup
  const monthlyProfit = (savedRevenueMin - fee);
  // ROI Calculation (Efficiency Gained / Fee)
  const roiMultipler = fee > 0 ? (efficiencyGained / fee) : 0;

  const daysToBreakEven = monthlyProfit > 0 ? Math.ceil((setupFee / monthlyProfit) * 30) : 999;

  const handleSave = async () => {
    await updateRoiMutation.mutateAsync({
      monthlyRevenue,
      monthlyAdBudget,
      lossScenarioMin: lossMin,
      lossScenarioMax: lossMax,
      adsEngineerFee: fee,
    });
  };

  const formatEuro = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  if (!isAuthenticated) {
    return <div>Bitte melden Sie sich an.</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Inputs & Script */}
        <div className="xl:col-span-5 space-y-6">
          {/* Input Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Calculator Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Monthly Ad Budget (€)</Label>
                <div className="text-2xl font-bold text-primary">{formatEuro(monthlyAdBudget)}</div>
                <Slider
                  value={[monthlyAdBudget]}
                  onValueChange={(val) => setMonthlyAdBudget(val[0])}
                  min={100000} max={10000000} step={10000}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Estimated Guesswork / Loss (%)</Label>
                  <span className="font-bold">{lossMin}%</span>
                </div>
                <Slider
                  value={[lossMin]}
                  onValueChange={(val) => setLossMin(val[0])}
                  min={5} max={50} step={1}
                />
              </div>

              <div className="space-y-2 pb-4 border-b border-slate-100">
                <Label>Monthly Revenue (€)</Label>
                <div className="text-2xl font-bold text-primary">{formatEuro(monthlyRevenue)}</div>
                <Slider
                  value={[monthlyRevenue]}
                  onValueChange={(val) => setMonthlyRevenue(val[0])}
                  min={100000} max={50000000} step={100000}
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <Label>AdsEngineer Fee (€)</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={autoPricing} onChange={(e) => setAutoPricing(e.target.checked)} id="auto-pricing" />
                    <label htmlFor="auto-pricing">Auto-calculate Price</label>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  Based on Revenue + AdSpend + Recoverable Loss
                </div>
                <Input
                  type="number"
                  value={fee / 100}
                  onChange={(e) => {
                    setFee(Number(e.target.value) * 100);
                    setAutoPricing(false);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* THE SALES PITCH */}
          <Card className="bg-slate-900 text-slate-100 border-slate-700 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-blue-400" />
                Dynamic Sales Script
              </CardTitle>
              <CardDescription className="text-slate-400">
                Read this exactly to the client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <blockquote className="text-xl font-medium leading-relaxed font-serif italic opacity-90">
                "Think of it this way: <span className="text-blue-400 font-bold">{lossMin}%</span> of your <span className="text-blue-400 font-bold">{formatEuro(monthlyAdBudget)}</span> budget is currently 'guessing.'
                <br /><br />
                That’s <span className="text-red-400 font-bold bg-red-900/30 px-1 rounded">{formatEuro(wastedSpend)}</span> every month that Google is spending without knowing if it actually worked.
                <br /><br />
                My tool removes the guesswork. I’m essentially giving you <span className="text-green-400 font-bold bg-green-900/30 px-1 rounded">{formatEuro(efficiencyGained)}</span> of 'efficiency' back for a <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">{formatEuro(fee)}</span> fee."
              </blockquote>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Visuals & Metrics */}
        <div className="xl:col-span-7 space-y-6 print:col-span-12 print:w-full">

          {/* The "Wasted vs Recovered" Visual */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Monthly Burn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-700">{formatEuro(wastedSpend)}</div>
                <p className="text-sm text-red-600 mt-1">Wasted on unverified clicks</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Efficiency Gained
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-700">{formatEuro(efficiencyGained)}</div>
                <p className="text-sm text-green-600 mt-1">Recovered for profitable ads</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ROI & Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Monthly ROI</div>
                  <div className="text-4xl font-black text-slate-800">
                    {(roiMultipler * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Return on Fee</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Net Profit</div>
                  <div className="text-4xl font-black text-green-600">
                    {formatEuro(efficiencyGained - fee)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">After Fee</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Break Even</div>
                  <div className="text-4xl font-black text-blue-600">
                    {daysToBreakEven}d
                  </div>
                  <div className="text-xs text-slate-500 mt-2">To cover setup fee</div>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">Long Term Value</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-end border-b pb-2">
                    <span>1 Year Projected Savings</span>
                    <span className="font-bold text-lg">{formatEuro(wastedSpend * 12)}</span>
                  </div>
                  <div className="flex justify-between items-end border-b pb-2">
                    <span>3 Year Projected Savings</span>
                    <span className="font-bold text-lg text-purple-600">{formatEuro(wastedSpend * 36)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 print:hidden">
            <Button onClick={() => window.print()} variant="outline" className="flex-1" size="lg">
              <Printer className="w-4 h-4 mr-2" />
              Print Client Report
            </Button>
            <Button onClick={handleSave} className="flex-1" size="lg" disabled={updateRoiMutation.isPending}>
              {updateRoiMutation.isPending ? "Saving..." : "Save Calculation to Database"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
