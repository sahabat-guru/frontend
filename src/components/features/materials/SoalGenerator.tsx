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
import { Loader2, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SoalGeneratorProps {
  onGenerate?: (result: any) => void;
}

export function SoalGenerator({ onGenerate }: SoalGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    jenjang: "",
    jumlah_soal: 10,
    tipe_soal: ["pilihan_ganda"],
    tingkat_kesulitan: ["sedang"],
    include_hots: true,
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
        type: "QUESTIONS", // Matches 'QUESTIONS' in schema
        topic: formData.topic,
        jenjang: formData.jenjang,
        jumlah_soal: Number(formData.jumlah_soal),
        tipe_soal: formData.tipe_soal,
        tingkat_kesulitan: formData.tingkat_kesulitan,
        include_hots: formData.include_hots,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await axios.post(
        `${API_URL}/materials/generate`,
        payload
      );

      onGenerate?.(response.data);
      toast({
        title: "Success",
        description: "Questions generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating Questions:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate Questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-fit border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Konfigurasi Soal</CardTitle>
        <CardDescription>
          Buat bank soal latihan, ulangan, atau ujian
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label>Topik/Materi *</Label>
          <Input
            placeholder="Contoh: Aljabar Dasar"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jenjang *</Label>
            <Select
              onValueChange={(val) => handleChange("jenjang", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SD">SD</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="SMA">SMA</SelectItem>
                <SelectItem value="SMK">SMK</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jumlah Soal</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={formData.jumlah_soal}
              onChange={(e) => handleChange("jumlah_soal", e.target.value)}
            />
          </div>
        </div>

        {/* Multiselect replacements for Select */}
        <div className="space-y-2">
          <Label>Tipe Soal</Label>
          <Select
            value={formData.tipe_soal[0]}
            onValueChange={(val) => handleChange("tipe_soal", [val])} // Simplified to single select for now
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pilihan_ganda">Pilihan Ganda</SelectItem>
              <SelectItem value="esai">Esai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tingkat Kesulitan</Label>
          <Select
            value={formData.tingkat_kesulitan[0]}
            onValueChange={(val) => handleChange("tingkat_kesulitan", [val])} // Simplified
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mudah">Mudah</SelectItem>
              <SelectItem value="sedang">Sedang</SelectItem>
              <SelectItem value="sulit">Sulit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="include_hots"
            checked={formData.include_hots}
            onChange={(e) => handleChange("include_hots", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="include_hots">Termasuk Soal HOTS (Higher Order Thinking Skills)</Label>
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
              Generating Soal...
            </>
          ) : (
            <>
              <FileQuestion className="mr-2 h-4 w-4" />
              Generate Soal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
