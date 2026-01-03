import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Trash2, Plus, Edit2, Users, Calculator } from "lucide-react";
import { toast } from "sonner";

export default function CustomerTracker() {
  const { isAuthenticated } = useAuth();
  const { data: customers, refetch: refetchCustomers } = trpc.customers.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: costs } = trpc.costs.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.customers.create.useMutation();
  const updateMutation = trpc.customers.update.useMutation();
  const deleteMutation = trpc.customers.delete.useMutation();

  const [name, setName] = useState("");
  const [mrr, setMrr] = useState("");
  const [status, setStatus] = useState<"pipeline" | "in_negotiation" | "active" | "inactive">("pipeline");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Calculate total costs for coverage percentage
  const totalCosts = costs?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalMRR = customers?.reduce((sum, c) => sum + c.monthlyRecurringRevenue, 0) || 0;

  const handleAddCustomer = async () => {
    if (!name || !mrr) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name,
          status,
          monthlyRecurringRevenue: Number(mrr) * 100,
        });
        toast.success("Kunde aktualisiert");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          name,
          status,
          monthlyRecurringRevenue: Number(mrr) * 100,
        });
        toast.success("Kunde hinzugefügt");
      }
      setName("");
      setMrr("");
      setStatus("pipeline");
      refetchCustomers();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleEditCustomer = (customer: any) => {
    setEditingId(customer.id);
    setName(customer.name);
    setMrr((customer.monthlyRecurringRevenue / 100).toString());
    setStatus(customer.status);
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Kunde gelöscht");
      refetchCustomers();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "in_negotiation":
        return "bg-yellow-100 text-yellow-800";
      case "pipeline":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "in_negotiation":
        return "In Verhandlung";
      case "pipeline":
        return "Pipeline";
      case "inactive":
        return "Inaktiv";
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return <div>Bitte melden Sie sich an.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamt MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalMRR / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
            <p className="text-xs text-gray-500 mt-1">{customers?.length || 0} Kunden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fixkosten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalCosts / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
          </CardContent>
        </Card>

        <Card className={totalMRR >= totalCosts ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${totalMRR >= totalCosts ? "text-green-700" : "text-orange-700"}`}>
              Deckung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalMRR >= totalCosts ? "text-green-900" : "text-orange-900"}`}>
              {totalCosts > 0 ? Math.round((totalMRR / totalCosts) * 100) : 0}%
            </p>
            <p className={`text-xs mt-1 ${totalMRR >= totalCosts ? "text-green-600" : "text-orange-600"}`}>
              {totalMRR >= totalCosts ? "Ziel erreicht!" : "Noch " + ((totalCosts - totalMRR) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }) + " nötig"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Customer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Kunde bearbeiten" : "Neuer Kunde"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kundenname</Label>
              <Input
                id="name"
                placeholder="z.B. Mycannaby"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrr">MRR (€)</Label>
              <Input
                id="mrr"
                type="number"
                placeholder="500"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="in_negotiation">In Verhandlung</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleAddCustomer} className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Wird gespeichert..." : editingId ? "Aktualisieren" : "Hinzufügen"}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setMrr("");
                    setStatus("pipeline");
                  }}
                >
                  Abbrechen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Kunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers?.length === 0 ? (
            <p className="text-gray-500">Keine Kunden hinzugefügt</p>
          ) : (
            <div className="space-y-3">
              {customers?.map((customer) => {
                const coveragePercentage = totalCosts > 0 ? Math.round((customer.monthlyRecurringRevenue / totalCosts) * 100) : 0;
                return (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-gray-600">
                            MRR: {(customer.monthlyRecurringRevenue / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusLabel(customer.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Deckung: {coveragePercentage}% der Fixkosten
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="soft"
                        size="sm"
                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                        onClick={() => window.location.href = `/roi-calculator?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}&currentFee=${customer.monthlyRecurringRevenue}`}
                      >
                        <Calculator className="w-4 h-4 mr-1" />
                        Calc
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
