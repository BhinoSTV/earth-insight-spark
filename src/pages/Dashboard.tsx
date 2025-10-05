import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/providers/auth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Earth Insight Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {user
                ? `Welcome back, ${user.first_name || user.username}!`
                : "Monitor your geospatial intelligence tools in one place."}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="w-full justify-start space-x-2 overflow-x-auto">
            <TabsTrigger value="home" className="px-4 py-2">
              Home
            </TabsTrigger>
            <TabsTrigger value="ahp" className="px-4 py-2">
              AHP Calculator
            </TabsTrigger>
            <TabsTrigger value="geo-hiss" className="px-4 py-2">
              Geo-HISS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Surface quick stats, reports, or announcements for your team.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Add key performance indicators, charts, or project snapshots.
                </div>
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Stream recent activity, alerts, or collaboration updates.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ahp" className="focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>AHP Calculator</CardTitle>
                <CardDescription>
                  Launch the Analytic Hierarchy Process workflows and saved models.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Embed comparison matrices, scoring tools, or scenario planning widgets here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geo-hiss" className="focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Geo-HISS</CardTitle>
                <CardDescription>
                  Manage hazard intelligence feeds, geospatial overlays, and response plans.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Plug in map views, data layers, or automation controls tailored to your needs.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
