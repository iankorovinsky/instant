"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioModels, formatDate } from "@/lib/pms/mock-data";

export default function ModelsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModels = portfolioModels.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Models</h1>
          <p className="text-muted-foreground mt-1">
            Reusable model definitions for consistent portfolio management
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Model
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Library</CardTitle>
              <CardDescription>
                {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Duration Target</TableHead>
                <TableHead className="text-right">Assigned Accounts</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow
                  key={model.modelId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/app/pms/models/${model.modelId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{model.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {model.description}
                  </TableCell>
                  <TableCell className="text-right">{model.durationTarget}y</TableCell>
                  <TableCell className="text-right">{model.assignedAccountIds.length}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(model.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredModels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No models found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
