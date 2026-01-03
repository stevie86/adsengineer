import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Euro, TrendingUp, Users, Target, Download } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  const { data: costs } = trpc.costs.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: customers } = trpc.customers.list.useQuery(undefined, { enabled: isAuthenticated });

  const utils = trpc.useUtils();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = await utils.reports.getExportCsv.fetch();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `business_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Willkommen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bitte melden Sie sich an, um fortzufahren.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const businessCosts = costs?.filter((c) => c.category === "business").reduce((sum, c) => sum + c.amount, 0) || 0;
  const privateCosts = costs?.filter((c) => c.category === "private").reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalCosts = businessCosts + privateCosts;
  const totalMRR = customers?.reduce((sum, c) => sum + c.monthlyRecurringRevenue, 0) || 0;
  const coveragePercentage = totalCosts > 0 ? Math.round((totalMRR / totalCosts) * 100) : 0;

  // Prepare chart data
  const costBreakdown = [
    { name: "Business", value: businessCosts / 100 },
    { name: "Private", value: privateCosts / 100 },
  ];

  const customerData = customers?.map((c) => ({
    name: c.name,
    mrr: c.monthlyRecurringRevenue / 100,
    status: c.status,
  })) || [];

  const COLORS = ["#3b82f6", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Button onClick={handleExport} variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Export Data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total MRR Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Monatlicher MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalMRR / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
            <p className="text-xs text-gray-500 mt-1">{customers?.length || 0} Kunden</p>
          </CardContent>
        </Card>

        {/* Freedom Number Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Freedom-Zahl
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
            <p className="text-xs text-gray-500 mt-1">Monatliche Fixkosten</p>
          </CardContent>
        </Card>

        {/* Coverage Percentage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Deckung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{coveragePercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">Fixkosten-Deckung</p>
          </CardContent>
        </Card>

        {/* Active Customers Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Aktive Kunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers?.filter((c) => c.status === "active").length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">von {customers?.length || 0} gesamt</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Kostenaufschlüsselung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: €${value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `€${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer MRR Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>MRR nach Kunde</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `€${Number(value).toFixed(2)}`} />
                <Bar dataKey="mrr" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Fixkosten-Deckung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Erreicht: {(totalMRR / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
              <span className="text-gray-600">Ziel: {(totalCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{coveragePercentage}% der Fixkosten gedeckt</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
