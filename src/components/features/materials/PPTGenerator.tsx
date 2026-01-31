"use client";

import { useState } from "react";
import api from "@/lib/api";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Palette, Image as ImageIcon, Wand2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PPTGeneratorProps {
  onGenerate: (data: any) => void;
}

const TEMPLATES = [
  { id: "minimalis", name: "Minimalis", description: "Clean, simple, dan elegan" },
  { id: "futuristic", name: "Futuristic", description: "Tema gelap aksen neon" },
  { id: "professional", name: "Professional", description: "Tampilan korporat terpercaya" },
  { id: "colorful", name: "Colorful", description: "Warna-warni cerah playful" },
  { id: "organic", name: "Organic", description: "Nuansa alam earthy" },
];

export function PPTGenerator({ onGenerate }: PPTGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    jenjang: "",
    mata_pelajaran: "",
    template: "futuristic",
    kurikulum: "kurikulum_merdeka",
    detail_level: "lengkap",
    include_examples: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.jenjang || !formData.mata_pelajaran) {
      toast({
        title: "Validation Error",
        description: "Mohon isi Topik, Mata Pelajaran, dan Kelas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Construct payload exactly as backend requires
      const payload = {
        template: formData.template,
        topic: formData.topic,
        kurikulum: formData.kurikulum, // Defaults to kurikulum_merdeka
        jenjang: formData.jenjang,
        detail_level: formData.detail_level, // Defaults to lengkap
        include_examples: formData.include_examples,
      };

      const response = await api.post(`/materials/generate`, { type: "PPT", ...payload });

      // Pass the data object which contains previewUrl
      onGenerate(response.data.data || response.data);
      toast({ title: "Success", description: "Presentasi berhasil dibuat!" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal membuat presentasi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
      <CardHeader className="pb-2 bg-white shrink-0">
        <CardTitle className="text-xl font-bold text-gray-800">Konfigurasi PPT</CardTitle>
        <CardDescription className="text-gray-500">
          Atur parameter presentasi
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6 pt-2">
        {/* Topik */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Topik Presentasi <span className="text-red-500">*</span></Label>
          <Textarea
            placeholder="Contoh: Hukum Newton tentang Gerak"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            className="min-h-[80px] resize-y bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        {/* Mata Pelajaran & Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Mata Pelajaran <span className="text-red-500">*</span></Label>
            <Select
              value={formData.mata_pelajaran}
              onValueChange={(val) => handleChange("mata_pelajaran", val)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="Matematika">Matematika</SelectItem>
                <SelectItem value="Fisika">Fisika</SelectItem>
                <SelectItem value="Kimia">Kimia</SelectItem>
                <SelectItem value="Biologi">Biologi</SelectItem>
                <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
                <SelectItem value="Sejarah">Sejarah</SelectItem>
                <SelectItem value="Geografi">Geografi</SelectItem>
                <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                <SelectItem value="Sosiologi">Sosiologi</SelectItem>
                <SelectItem value="PPKN">PPKN</SelectItem>
                <SelectItem value="Seni Budaya">Seni Budaya</SelectItem>
                <SelectItem value="Prakarya">Prakarya</SelectItem>
                <SelectItem value="Informatika">Informatika</SelectItem>
                <SelectItem value="Pendidikan Agama">Pendidikan Agama</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Kelas <span className="text-red-500">*</span></Label>
            <Select value={formData.jenjang} onValueChange={(val) => handleChange("jenjang", val)}>
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

        {/* Kurikulum */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Kurikulum</Label>
          <Select
            value={formData.kurikulum}
            onValueChange={(val) => handleChange("kurikulum", val)}
          >
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="Pilih Kurikulum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kurikulum_merdeka">Kurikulum Merdeka</SelectItem>
              <SelectItem value="kurikulum_2013">Kurikulum 2013</SelectItem>
              <SelectItem value="cambridge">Cambridge</SelectItem>
              <SelectItem value="international_baccalaureate">International Baccalaureate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Detail Level */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Detail Materi</Label>
          <Select value={formData.detail_level} onValueChange={(val) => handleChange("detail_level", val)}>
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="Pilih Detail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ringkas">Ringkas</SelectItem>
              <SelectItem value="sedang">Sedang</SelectItem>
              <SelectItem value="lengkap">Lengkap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Template Design */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-500" />
            <Label className="text-gray-700 font-medium">Template Desain</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleChange("template", t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${formData.template === t.id
                  ? "bg-[#0093E9] text-white border-[#0093E9]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                title={t.description}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => handleChange("include_examples", !formData.include_examples)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.include_examples
              ? "bg-[#0093E9] text-white border-[#0093E9]"
              : "bg-white text-gray-600 border-gray-200"
              }`}
          >
            <BookOpen className="h-3 w-3" />
            Include Examples
          </button>
        </div>
      </CardContent>

      <div className="p-4 pt-0 shrink-0">
        <Button
          className="w-full h-12 text-lg bg-gradient-to-r from-[#6ACBE0] to-[#85E0A3] hover:opacity-95 text-white rounded-xl shadow-lg shadow-[#5FC7A4]/20 transition-all hover:scale-[1.01] active:scale-[0.99] border-0"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating PPT...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate PPT
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
