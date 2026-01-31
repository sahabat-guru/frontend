"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MonitorPlay } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PPTGeneratorProps {
  onGenerate?: (result: any) => void;
}

export function PPTGenerator({ onGenerate }: PPTGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    kurikulum: "kurikulum_merdeka",
    jenjang: "",
    template: "minimalis",
    detail_level: "lengkap",
    include_examples: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.jenjang) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: "PPT",
        topic: formData.topic,
        kurikulum: formData.kurikulum,
        jenjang: formData.jenjang,
        template: formData.template,
        detail_level: formData.detail_level,
        include_examples: formData.include_examples,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await axios.post(
        `${API_URL}/materials/generate`,
        payload
      );

      onGenerate?.(response.data);
      toast({
        title: "Success",
        description: "PPT generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating PPT:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate PPT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-fit border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Konfigurasi PPT</CardTitle>
        <CardDescription>
          Buat slide presentasi yang menarik dan informatif
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label>Topik Presentasi *</Label>
          <Input
            placeholder="Contoh: Pengenalan AI"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Jenjang *</Label>
          <Select
            onValueChange={(val) => handleChange("jenjang", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenjang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SD">SD</SelectItem>
              <SelectItem value="SMP">SMP</SelectItem>
              <SelectItem value="SMA">SMA</SelectItem>
              <SelectItem value="SMK">SMK</SelectItem>
              <SelectItem value="Umum">Umum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Template Style</Label>
            <Select
              value={formData.template}
              onValueChange={(val) => handleChange("template", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimalis">Minimalis</SelectItem>
                <SelectItem value="profesional">Profesional</SelectItem>
                <SelectItem value="kreatif">Kreatif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Detail Level</Label>
            <Select
              value={formData.detail_level}
              onValueChange={(val) => handleChange("detail_level", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ringkas">Ringkas</SelectItem>
                <SelectItem value="lengkap">Lengkap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="include_examples"
            checked={formData.include_examples}
            onChange={(e) => handleChange("include_examples", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="include_examples">Sertakan Contoh</Label>
        </div>

      </CardContent>
      <CardFooter className="px-0">
        <Button
          className="w-full bg-[#5FC7A4] hover:bg-[#4ab593] text-white"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PPT...
            </>
          ) : (
            <>
              <MonitorPlay className="mr-2 h-4 w-4" />
              Generate PPT
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
