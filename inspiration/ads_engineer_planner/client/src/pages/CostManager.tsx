import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Trash2, Plus, Target } from "lucide-react";
import { toast } from "sonner";

export default function CostManager() {
  const { isAuthenticated, user } = useAuth();
  const { data: costs, refetch } = trpc.costs.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.costs.create.useMutation();
  const deleteMutation = trpc.costs.delete.useMutation();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"business" | "private">("business");

  // Calculator State
  const [dealSize, setDealSize] = useState(500); // Default 500 EUR
  const [taxBuffer, setTaxBuffer] = useState(30); // Default 30%
  const [desiredAndSavings, setDesiredAndSavings] = useState(0); // Monthly desired net withdrawal
  const [savingsGoal, setSavingsGoal] = useState(0); // Total target sum

  // Calculate totals
  const businessCosts = costs?.filter((c) => c.category === "business").reduce((sum, c) => sum + c.amount, 0) || 0;
  const privateCosts = costs?.filter((c) => c.category === "private").reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalCosts = businessCosts + privateCosts;

  // Freedom Calculation
  const safeTaxBuffer = Math.min(taxBuffer, 99); // Prevent division by zero
  const monthlyNetTarget = (totalCosts / 100) + desiredAndSavings; // Costs + Desired Savings
  const targetRevenue = (monthlyNetTarget * 100) / (1 - (safeTaxBuffer / 100)); // Gross revenue needed
  const clientsNeeded = dealSize > 0 ? Math.ceil((targetRevenue / 100) / dealSize) : 0;

  // Goal Forecast
  const monthsToGoal = desiredAndSavings > 0 && savingsGoal > 0 ? Math.ceil(savingsGoal / desiredAndSavings) : 0;
  const goalDate = new Date();
  goalDate.setMonth(goalDate.getMonth() + monthsToGoal);

  const handleAddCost = async () => {
    if (!description || !amount) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    try {
      await createMutation.mutateAsync({
        category,
        description,
        amount: Number(amount) * 100,
      });
      setDescription("");
      setAmount("");
      setCategory("business");
      toast.success("Kosten hinzugefügt");
      refetch();
    } catch (error) {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleDeleteCost = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Kosten gelöscht");
      refetch();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
  };

  if (!isAuthenticated) {
    return <div>Bitte melden Sie sich an.</div>;
  }

  const safeCosts = costs || [];

  return (
    <div className="space-y-6">

      {/* Goal Calculator */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Target className="w-5 h-5" />
            Freedom & Savings Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Average Deal Size (€)</Label>
                <Input
                  type="number"
                  value={dealSize}
                  onChange={(e) => setDealSize(Number(e.target.value))}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Buffer (%)</Label>
                <Input
                  type="number"
                  value={taxBuffer}
                  onChange={(e) => setTaxBuffer(Number(e.target.value))}
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">Sets target to gross revenue needed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-800">Monthly Net Savings</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={desiredAndSavings || ""}
                  onChange={(e) => setDesiredAndSavings(Number(e.target.value))}
                  className="bg-white border-blue-200"
                />
                <p className="text-xs text-blue-600/80">Increases needed Revenue</p>
              </div>
              <div className="space-y-2">
                <Label className="text-green-800">Target Savings Goal (Total)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={savingsGoal || ""}
                  onChange={(e) => setSavingsGoal(Number(e.target.value))}
                  className="bg-white border-green-200"
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Target Revenue</div>
              <div className="text-3xl font-bold text-blue-900">
                {(targetRevenue / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </div>
              <div className="text-xs text-blue-600">
                Costs + Savings + Tax
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                {savingsGoal > 0 ? (
                  desiredAndSavings > 0 ? (
                    <>
                      <div className="text-sm font-medium text-green-700 uppercase tracking-wide">Goal Reached In</div>
                      <div className="text-xl font-bold text-green-800">
                        {monthsToGoal} Months
                      </div>
                      <div className="text-xs text-green-600">
                        {goalDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-red-500 font-medium">
                      Enter monthly savings to calculate timeline
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-400">
                    Enter a goal sum to see timeline
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-2 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Clients Needed</div>
              <div className="text-5xl font-black text-blue-600">
                {clientsNeeded}
              </div>
              <div className="text-xs text-muted-foreground">To hit Freedom Number</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Business Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(businessCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Private Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(privateCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Freedom Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900">{(totalCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Cost Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Cost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Rent, Software, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddCost} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Cost"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Business Costs</CardTitle>
        </CardHeader>
        <CardContent>
          {safeCosts.filter((c) => c.category === "business").length === 0 ? (
            <p className="text-gray-500">No business costs added</p>
          ) : (
            <div className="space-y-2">
              {safeCosts
                .filter((c) => c.category === "business")
                .map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{cost.description}</p>
                      <p className="text-sm text-gray-600">{(cost.amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCost(cost.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Private Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Private Costs</CardTitle>
        </CardHeader>
        <CardContent>
          {safeCosts.filter((c) => c.category === "private").length === 0 ? (
            <p className="text-gray-500">No private costs added</p>
          ) : (
            <div className="space-y-2">
              {safeCosts
                .filter((c) => c.category === "private")
                .map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{cost.description}</p>
                      <p className="text-sm text-gray-600">{(cost.amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCost(cost.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
