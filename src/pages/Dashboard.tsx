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
import AhpCalculator from "@/components/dashboard/AhpCalculator";
import GeoHissViewer from "@/components/dashboard/GeoHissViewer";
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
            <AhpCalculator />
          </TabsContent>

          <TabsContent value="geo-hiss" className="focus-visible:outline-none">
            <GeoHissViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
