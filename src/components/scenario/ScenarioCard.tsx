"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  id: string;
  title: string;
  description: string;
  topic: string;
  messageCount: number;
}

export function ScenarioCard({ id, title, description, topic, messageCount }: Props) {
  return (
    <Link href={`/scenario/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
        <CardHeader>
          <CardTitle className="text-base group-hover:text-blue-600 transition-colors flex items-center justify-between">
            {title}
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-gray-500 line-clamp-2">{topic}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircle className="w-3 h-3" />
            <span>{messageCount}개 발화</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
