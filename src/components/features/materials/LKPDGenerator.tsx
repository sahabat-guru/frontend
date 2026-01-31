import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Loader2,
  ScrollText,
  ListChecks,
  FlaskConical,
  Users,
  FileText,
  QrCode,
  LayoutDashboard,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LKPDGeneratorProps {
  onGenerate: (data: any) => void;
}

const JENIS_LKPD = [
  { id: "latihan", name: "Latihan Terbimbing", description: "Soal bertahap dengan panduan", icon: ListChecks },
  { id: "praktikum", name: "Praktikum", description: "Langkah-langkah eksperimen", icon: FlaskConical },
  { id: "proyek", name: "Proyek", description: "Tugas proyek berkelompok", icon: Users },
  { id: "cheat_sheet", name: "Cheat Sheet", description: "Ringkasan 1 halaman", icon: FileText },
];

const MAPEL_OPTIONS = [
  "Matematika", "Fisika", "Kimia", "Biologi",
  "Bahasa Indonesia", "Bahasa Inggris", "Sejarah",
  "Geografi", "Ekonomi", "Sosiologi", "PPKn",
  "Seni Budaya", "Prakarya", "Informatika", "Pendidikan Agama"
];

export function LKPDGenerator({ onGenerate }: LKPDGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topik_lkpd: "",
    kurikulum: "kurikulum_merdeka",
    jenjang: "",
    mata_pelajaran: "",
    jenis_lkpd: "latihan",
    fitur_tambahan: {
      qr_code: true,
      infographic: true
    }
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fitur_tambahan: { ...prev.fitur_tambahan, [feature]: checked }
    }));
  };

  const handleGenerate = async () => {
    if (!formData.topik_lkpd || !formData.jenjang || !formData.mata_pelajaran) {
      toast({
        title: "Validation Error",
        description: "Mohon lengkapi Topik, Mata Pelajaran, dan Kelas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        topik_lkpd: formData.topik_lkpd,
        kurikulum: formData.kurikulum,
        jenjang: formData.jenjang,
        mata_pelajaran: formData.mata_pelajaran,
        jenis_lkpd: formData.jenis_lkpd,
        fitur_tambahan: formData.fitur_tambahan
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_URL}/materials/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LKPD", ...payload }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      onGenerate(data.data || data);
      toast({ title: "Success", description: "LKPD berhasil dibuat!" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal membuat LKPD.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
      <CardHeader className="pb-2 bg-white shrink-0">
        <CardTitle className="text-xl font-bold text-gray-800">Konfigurasi LKPD</CardTitle>
        <CardDescription className="text-gray-500">
          Atur jenis dan konten lembar kerja
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6 pt-2">
        {/* Topik */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Topik LKPD <span className="text-red-500">*</span></Label>
          <Textarea
            placeholder="Contoh: Hukum Newton tentang Gerak"
            value={formData.topik_lkpd}
            onChange={(e) => handleChange("topik_lkpd", e.target.value)}
            className="min-h-[80px] bg-gray-50 border-gray-200 focus:bg-white resize-y"
          />
        </div>

        {/* Mapel & Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Mata Pelajaran</Label>
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
            <Label className="text-gray-700 font-medium">Kelas</Label>
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

        {/* Jenis LKPD Selection */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Jenis LKPD</Label>
          <div className="grid grid-cols-2 gap-3">
            {JENIS_LKPD.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${formData.jenis_lkpd === item.id
                    ? "border-[#0EA5E9] bg-[#0EA5E9]/5 ring-1 ring-[#0EA5E9]"
                    : "border-gray-200"
                    }`}
                  onClick={() => handleChange("jenis_lkpd", item.id)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-[#0EA5E9]" />
                    <div>
                      <p className={`text-sm font-semibold ${formData.jenis_lkpd === item.id ? "text-gray-900" : "text-gray-700"
                        }`}>{item.name}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fitur Tambahan */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-medium">Fitur Tambahan</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="qr_code"
                checked={formData.fitur_tambahan.qr_code}
                onCheckedChange={(c) => handleFeatureChange("qr_code", c as boolean)}
                className="rounded-full data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
              />
              <label
                htmlFor="qr_code"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-gray-600"
              >
                <QrCode className="h-4 w-4 text-black" />
                QR Code ke video/referensi
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="infographic"
                checked={formData.fitur_tambahan.infographic}
                onCheckedChange={(c) => handleFeatureChange("infographic", c as boolean)}
                className="rounded-full data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
              />
              <label
                htmlFor="infographic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-gray-600"
              >
                <LayoutDashboard className="h-4 w-4 text-black" />
                Infographic Summary (Cheat Sheet)
              </label>
            </div>
          </div>
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
              Generating LKPD...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate LKPD
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
