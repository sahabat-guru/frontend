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
import { Loader2, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LKPDGeneratorProps {
  onGenerate?: (result: any) => void;
}

export function LKPDGenerator({ onGenerate }: LKPDGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topik_lkpd: "",
    kurikulum: "kurikulum_merdeka",
    jenjang: "",
    mata_pelajaran: "",
    kelas: "",
    jenis_lkpd: "latihan",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topik_lkpd || !formData.jenjang || !formData.mata_pelajaran || !formData.kelas) {
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
        type: "LKPD",
        topik_lkpd: formData.topik_lkpd,
        kurikulum: formData.kurikulum,
        jenjang: formData.jenjang,
        mata_pelajaran: formData.mata_pelajaran,
        kelas: formData.kelas,
        jenis_lkpd: formData.jenis_lkpd,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await axios.post(
        `${API_URL}/materials/generate`,
        payload
      );

      onGenerate?.(response.data);
      toast({
        title: "Success",
        description: "LKPD generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating LKPD:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate LKPD",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-fit border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Konfigurasi LKPD</CardTitle>
        <CardDescription>
          Buat Lembar Kerja Peserta Didik dengan mudah
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label>Topik LKPD *</Label>
          <Input
            placeholder="Contoh: Eksperimen Fotosintesis"
            value={formData.topik_lkpd}
            onChange={(e) => handleChange("topik_lkpd", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mata Pelajaran *</Label>
            <Input
              value={formData.mata_pelajaran}
              onChange={(e) => handleChange("mata_pelajaran", e.target.value)}
              placeholder="Biologi"
            />
          </div>
          <div className="space-y-2">
            <Label>Kelas *</Label>
            <Input
              value={formData.kelas}
              onChange={(e) => handleChange("kelas", e.target.value)}
              placeholder="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis LKPD</Label>
            <Select
              value={formData.jenis_lkpd}
              onValueChange={(val) => handleChange("jenis_lkpd", val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latihan">Latihan Soal</SelectItem>
                <SelectItem value="eksperimen">Eksperimen</SelectItem>
                <SelectItem value="diskusi">Diskusi Kelompok</SelectItem>
                <SelectItem value="proyek">Proyek</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              Generating LKPD...
            </>
          ) : (
            <>
              <ScrollText className="mr-2 h-4 w-4" />
              Generate LKPD
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
