"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Wand2, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RPPGeneratorProps {
  onGenerate?: (result: any) => void;
}

export function RPPGenerator({ onGenerate }: RPPGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    kurikulum: "kurikulum_merdeka",
    jenjang: "", // This will be the "Kelas" value as per user instruction
    mata_pelajaran: "",
    alokasi_waktu: "2 x 45 menit",
    // Backend requirements not explicitly in image but needed
    karakteristik_siswa: "",
    tujuan_pembelajaran: [""] as string[],
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddObjective = () => {
    setFormData((prev) => ({
      ...prev,
      tujuan_pembelajaran: [...prev.tujuan_pembelajaran, ""],
    }));
  };

  const handleRemoveObjective = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tujuan_pembelajaran: prev.tujuan_pembelajaran.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.tujuan_pembelajaran];
    newObjectives[index] = value;
    setFormData((prev) => ({ ...prev, tujuan_pembelajaran: newObjectives }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.topic || !formData.jenjang) {
      toast({
        title: "Missing Information",
        description: "Mohon isi Topik dan Kelas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Constructing payload to match backend schema exactly

      // Ensure at least one objective if empty
      let objectives = formData.tujuan_pembelajaran.filter(t => t.trim() !== "");
      if (objectives.length === 0) {
        objectives = [`Memahami konsep ${formData.topic}`];
      }

      // Merging Mata Pelajaran into Topic to ensure context is passed if backend "topic" is the main prompt
      const finalTopic = formData.mata_pelajaran ? `[${formData.mata_pelajaran}] ${formData.topic}` : formData.topic;

      const payload = {
        type: "RPP",
        topic: finalTopic,
        kurikulum: formData.kurikulum,
        jenjang: formData.jenjang, // User: "jenjang = kelas"
        tujuan_pembelajaran: objectives,
        karakteristik_siswa: formData.karakteristik_siswa,
        alokasi_waktu: formData.alokasi_waktu,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await axios.post(
        `${API_URL}/materials/generate`,
        payload
      );

      onGenerate?.(response.data);
      toast({
        title: "Success",
        description: "RPP generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating RPP:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate RPP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
      <CardHeader className="pb-2 bg-white shrink-0">
        <CardTitle className="text-xl font-bold text-gray-800">Konfigurasi RPP</CardTitle>
        <CardDescription className="text-gray-500">
          Isi detail materi yang ingin dibuatkan RPP
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6 pt-2 flex-1 overflow-y-auto">
        {/* Topik / Materi Pokok */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Topik/Materi Pokok <span className="text-red-500">*</span></Label>
          <Textarea
            placeholder="Contoh: Hukum Newton tentang Gerak"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            className="min-h-[100px] resize-y bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        {/* Mata Pelajaran & Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Mata Pelajaran</Label>
            <Select
              value={formData.mata_pelajaran}
              onValueChange={(val) => handleChange("mata_pelajaran", val)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Matematika">Matematika</SelectItem>
                <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
                <SelectItem value="IPA">IPA</SelectItem>
                <SelectItem value="IPS">IPS</SelectItem>
                <SelectItem value="Fisika">Fisika</SelectItem>
                <SelectItem value="Kimia">Kimia</SelectItem>
                <SelectItem value="Biologi">Biologi</SelectItem>
                <SelectItem value="Sejarah">Sejarah</SelectItem>
                <SelectItem value="Geografi">Geografi</SelectItem>
                <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                <SelectItem value="Seni Budaya">Seni Budaya</SelectItem>
                <SelectItem value="PJOK">PJOK</SelectItem>
                <SelectItem value="Informatika">Informatika</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Kelas</Label>
            <Select onValueChange={(val) => handleChange("jenjang", val)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kelas 1">Kelas 1</SelectItem>
                <SelectItem value="Kelas 2">Kelas 2</SelectItem>
                <SelectItem value="Kelas 3">Kelas 3</SelectItem>
                <SelectItem value="Kelas 4">Kelas 4</SelectItem>
                <SelectItem value="Kelas 5">Kelas 5</SelectItem>
                <SelectItem value="Kelas 6">Kelas 6</SelectItem>
                <SelectItem value="Kelas 7">Kelas 7</SelectItem>
                <SelectItem value="Kelas 8">Kelas 8</SelectItem>
                <SelectItem value="Kelas 9">Kelas 9</SelectItem>
                <SelectItem value="Kelas 10">Kelas 10</SelectItem>
                <SelectItem value="Kelas 11">Kelas 11</SelectItem>
                <SelectItem value="Kelas 12">Kelas 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kurikulum & Alokasi Waktu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Kurikulum</Label>
            <Select
              value={formData.kurikulum}
              onValueChange={(val) => handleChange("kurikulum", val)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kurikulum_merdeka">
                  Kurikulum Merdeka
                </SelectItem>
                <SelectItem value="kurikulum_2013">
                  Kurikulum 2013
                </SelectItem>
                <SelectItem value="cambridge">
                  Cambridge
                </SelectItem>
                <SelectItem value="international_baccalaureate">
                  International Baccalaureate
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Alokasi Waktu</Label>
            <Input
              value={formData.alokasi_waktu}
              onChange={(e) => handleChange("alokasi_waktu", e.target.value)}
              className="bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Objectives - Keeping it but compact */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-gray-700 font-medium">Tujuan Pembelajaran</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddObjective}
              type="button"
              className="h-6 text-xs text-primary"
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
            {formData.tujuan_pembelajaran.map((goal, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) =>
                    handleObjectiveChange(idx, e.target.value)
                  }
                  placeholder={`Tujuan ${idx + 1}`}
                  className="h-9 bg-gray-50 text-sm"
                />
                {formData.tujuan_pembelajaran.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-400 hover:text-red-500"
                    onClick={() => handleRemoveObjective(idx)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Karakteristik Siswa (Opsional)</Label>
          <Textarea
            placeholder="Contoh: Siswa aktif, suka visual..."
            value={formData.karakteristik_siswa}
            onChange={(e) =>
              handleChange("karakteristik_siswa", e.target.value)
            }
          />
        </div>
      </CardContent>

      {/* Generate Button - Full Width, Green Gradient or Solid Color */}
      <div className="p-6 pt-0 shrink-0">
        <Button
          className="w-full h-12 text-lg bg-gradient-to-r from-[#6ACBE0] to-[#85E0A3] hover:opacity-95 text-white rounded-xl shadow-lg shadow-[#5FC7A4]/20 transition-all hover:scale-[1.01] active:scale-[0.99] border-0"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating RPP...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate RPP
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
