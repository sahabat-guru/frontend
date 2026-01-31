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
import {
  Loader2,
  Wand2,
  CheckCircle2,
  Circle,
  FileText,
  ListChecks,
  BookOpen,
  CircleDot,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SoalGeneratorProps {
  onGenerate?: (result: any) => void;
}

const MAPEL_OPTIONS = [
  "Matematika", "Fisika", "Kimia", "Biologi",
  "Bahasa Indonesia", "Bahasa Inggris", "Sejarah",
  "Geografi", "Ekonomi", "Sosiologi", "PPKN",
  "Seni Budaya", "Prakarya", "Informatika", "Pendidikan Agama"
];

const DIFFICULTIES = [
  { id: "mudah", label: "Mudah (C1-C2)", color: "bg-green-500", border: "border-green-500", text: "text-green-500" },
  { id: "sedang", label: "Sedang (C3-C4)", color: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-500" },
  { id: "sulit", label: "Sulit (C5)", color: "bg-orange-500", border: "border-orange-500", text: "text-orange-500" },
];

export function SoalGenerator({ onGenerate }: SoalGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    topic: "",
    mata_pelajaran: "",
    jenjang: "",
    jumlah_soal: 10,
    selected_types: ["pilihan_ganda", "esai"],
    difficulties: ["sedang"],
    include_hots: true
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleType = (type: string) => {
    setFormData(prev => {
      const current = prev.selected_types;
      const exists = current.includes(type);
      return {
        ...prev,
        selected_types: exists
          ? current.filter(t => t !== type)
          : [...current, type]
      };
    });
  };

  const toggleDifficulty = (diff: string) => {
    setFormData(prev => {
      const current = prev.difficulties;
      const exists = current.includes(diff);
      return {
        ...prev,
        difficulties: exists
          ? current.filter(d => d !== diff)
          : [...current, diff]
      };
    });
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.jenjang || !formData.mata_pelajaran) {
      toast({
        title: "Validation Error",
        description: "Mohon lengkapi data konfigurasi.",
        variant: "destructive",
      });
      return;
    }

    if (formData.selected_types.length === 0) {
      toast({
        title: "Validation Error",
        description: "Pilih minimal satu tipe soal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        topic: formData.topic,
        jenjang: formData.jenjang,
        jumlah_soal: Number(formData.jumlah_soal),
        tipe_soal: formData.selected_types,
        tingkat_kesulitan: formData.difficulties.length > 0 ? formData.difficulties : ["sedang"],
        include_hots: formData.include_hots,
      };

      const response = await api.post(
        `/materials/generate`,
        { type: "QUESTIONS", ...payload }
      );

      // Adaptation: Check if response format is data.data or just data
      const resultData = response.data.data || response.data;
      onGenerate?.(resultData);

      toast({
        title: "Success",
        description: "Soal berhasil dibuat!",
      });
    } catch (error: any) {
      console.error("Error generating Questions:", error);
      toast({
        title: "Error",
        description: "Gagal membuat soal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
      <CardHeader className="pb-2 bg-white shrink-0">
        <CardTitle className="text-xl font-bold text-gray-800">Konfigurasi Soal</CardTitle>
        <CardDescription className="text-gray-500">
          Atur jenis dan jumlah soal
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6 pt-2">
        {/* Topik */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Topik Ujian <span className="text-red-500">*</span></Label>
          <Textarea
            placeholder="Contoh: Hukum Newton I, II, dan III"
            value={formData.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            className="min-h-[80px] bg-gray-50 border-gray-200 focus:bg-white resize-y"
          />
        </div>

        {/* Mapel & Kelas */}
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
                {MAPEL_OPTIONS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
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
                {Array.from({ length: 12 }, (_, i) => i + 1).map((kelas) => (
                  <SelectItem key={kelas} value={`Kelas ${kelas}`}>Kelas {kelas}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jumlah Soal */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Jumlah Soal</Label>
          <Input
            type="number"
            value={formData.jumlah_soal}
            onChange={(e) => handleChange("jumlah_soal", e.target.value)}
            className="bg-white border-gray-200"
            min={1}
            max={50}
          />
        </div>

        {/* Jenis Soal */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Jenis Soal</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pilihan Ganda */}
            <div
              className={`relative rounded-xl border p-3 transition-all cursor-pointer flex items-center min-h-[80px] ${formData.selected_types.includes("pilihan_ganda")
                ? "border-[#6ACBE0] bg-[#6ACBE0]/5 ring-1 ring-[#6ACBE0]"
                : "border-gray-200 hover:bg-gray-50"
                }`}
              onClick={() => toggleType("pilihan_ganda")}
            >
              <div className="flex items-center gap-3 w-full">
                {formData.selected_types.includes("pilihan_ganda") ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0EA5E9] fill-[#0EA5E9]/10 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                <div className="flex items-center gap-2">
                  <CircleDot className={`h-4 w-4 ${formData.selected_types.includes("pilihan_ganda") ? "text-gray-900" : "text-gray-900"}`} />
                  <span className={`font-medium leading-tight text-sm ${formData.selected_types.includes("pilihan_ganda") ? "text-gray-900" : "text-gray-900"}`}>
                    Pilihan <br /> Ganda (PG)
                  </span>
                </div>
              </div>
            </div>

            {/* Esai */}
            <div
              className={`relative rounded-xl border p-3 transition-all cursor-pointer flex items-center min-h-[80px] ${formData.selected_types.includes("esai")
                ? "border-[#6ACBE0] bg-[#6ACBE0]/5 ring-1 ring-[#6ACBE0]"
                : "border-gray-200 hover:bg-gray-50"
                }`}
              onClick={() => toggleType("esai")}
            >
              <div className="flex items-center gap-3 w-full">
                {formData.selected_types.includes("esai") ? (
                  <div className="h-5 w-5 rounded-full bg-[#0EA5E9] flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`h-4 w-4 shrink-0 ${formData.selected_types.includes("esai") ? "text-gray-900" : "text-gray-900"}`} />
                  <span className={`font-medium text-sm ${formData.selected_types.includes("esai") ? "text-gray-900" : "text-gray-900"}`}>Esai/Uraian</span>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Tingkat Kesulitan */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Tingkat Kesulitan</Label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => {
              const selected = formData.difficulties.includes(diff.id);
              return (
                <button
                  key={diff.id}
                  onClick={() => toggleDifficulty(diff.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2
                    ${selected
                      ? `bg-[#0093E9] border-[#0093E9] text-white`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }
                    ${selected ? "ring-1 ring-[#0093E9]" : ""}
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${diff.color}`} />
                  {diff.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* HOTS Toggle Button */}
        <div className="pt-1">
          <button
            onClick={() => handleChange("include_hots", !formData.include_hots)}
            className={`
               px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border
               ${formData.include_hots
                ? "bg-[#0093E9] text-white border-[#0093E9] shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
             `}
          >
            <BookOpen className={`h-4 w-4 ${formData.include_hots ? "text-white" : "text-gray-500"}`} />
            Termasuk Soal HOTS (C6)
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
              Generating Soal...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Soal
            </>
          )}
        </Button>
      </div>
    </Card >
  );
}
