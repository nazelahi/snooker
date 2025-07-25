
"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/app/players/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone } from "lucide-react";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        setNotices(data);
      }
      setLoading(false);
    };

    fetchNotices();
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Megaphone className="h-10 w-10 text-primary" />
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold">Notice Board</h1>
                    <p className="text-muted-foreground">All club announcements and updates.</p>
                </div>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>

        {loading ? (
           <p>Loading notices...</p>
        ) : notices.length > 0 ? (
            <div className="space-y-6">
                {notices.map((notice) => (
                    <Card key={notice.id}>
                        <CardHeader>
                            <CardTitle>{notice.title}</CardTitle>
                            <CardDescription>{format(new Date(notice.date), "PPP")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
             <div className="text-center py-16">
                <h3 className="text-xl font-semibold">No Notices Found</h3>
                <p className="text-muted-foreground mt-2">There are no club notices at the moment.</p>
            </div>
        )}
    </div>
  );
}
