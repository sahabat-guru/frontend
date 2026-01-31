"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";

interface Material {
  id: string;
  title: string;
  type: string;
  createdAt: string | Date;
  fileUrl?: string;
  previewUrl?: string;
  isPublished: boolean;
}

export function MaterialArchive() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      // Attempt to fetch from backend
      try {
        const response = await axios.get(`${API_URL}/materials`);
        setMaterials(response.data.data || response.data || []);
      } catch (err) {
        console.warn("Backend unavailable or unauthorized, falling back to empty list", err);
        // Fallback to empty list or mock data if backend not reachable to prevent UI crash
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "Failed to load materials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await axios.delete(`${API_URL}/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Success",
        description: "Material deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete material.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
      if (isValid(date)) {
        return format(date, "PPP");
      }
      return "Invalid Date";
    } catch (e) {
      return "Date Error";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl mb-4">Arsip Materi</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center"
                  >
                    No materials found.
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      {material.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {material.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(material.createdAt)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {material.previewUrl && (
                        <Button size="icon" variant="ghost" asChild>
                          <a href={material.previewUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {material.fileUrl && (
                        <Button size="icon" variant="ghost" asChild>
                          <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
