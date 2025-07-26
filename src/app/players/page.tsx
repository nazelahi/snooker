

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3X3, List, Plus, Trophy, BarChart, Percent, Activity } from "lucide-react";
import { AddPlayerDialog } from "@/components/add-player-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@/lib/playersService";
import { playersService } from "@/lib/playersService";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [playersToShow, setPlayersToShow] = useState(10);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const fetchedPlayers = await playersService.getAllPlayers();
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load players. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleAddPlayer = async (newPlayer: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const createdPlayer = await playersService.createPlayer(newPlayer);
      setPlayers(prevPlayers => [...prevPlayers, createdPlayer]);
      
      toast({
        title: "Success",
        description: "Player added successfully.",
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add player. Please try again.",
      });
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedPlayers = filteredPlayers.slice(0, playersToShow);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground">Manage your snooker club members</p>
        </div>
        <Button onClick={() => setIsAddPlayerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-2">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} alt={player.name} />
                  <AvatarFallback>{player.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{player.name}</CardTitle>
                <CardDescription>{player.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Skill Level</span>
                  <Badge variant="outline">{player.skill_level}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-medium">{player.win_rate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Matches</span>
                  <span className="font-medium">{player.matches_played}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Highest Break</span>
                  <span className="font-medium">{player.highest_break}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={player.avatar || `https://placehold.co/80x80.png`} alt={player.name} />
                      <AvatarFallback>{player.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">{player.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{player.win_rate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{player.matches_played}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                      <span>{player.highest_break}</span>
                    </div>
                    <Badge variant="outline">{player.skill_level}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredPlayers.length > playersToShow && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setPlayersToShow(prev => prev + 10)}
          >
            Load More Players
          </Button>
        </div>
      )}

      {displayedPlayers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No players found.</p>
        </div>
      )}

      <AddPlayerDialog
        open={isAddPlayerOpen}
        onOpenChange={setIsAddPlayerOpen}
        onAddPlayer={handleAddPlayer}
      />
    </div>
  );
}
