"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Presentation,
  ClipboardList,
  BookOpen,
  Eye,
  Download,
  Trash2,
  Calendar,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";

interface Material {
  id: string;
  title: string;
  type: string;
  createdAt: string | Date;
  fileUrl?: string;
  previewUrl?: string;
  isPublished: boolean;
  metadata?: {
    kurikulum?: string;
    jenjang?: string;
    mata_pelajaran?: string;
    topic?: string;
    [key: string]: any;
  };
  contentJson?: any;
}

export function MaterialArchive() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all_status");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stats = [
    { label: "RPP", count: materials.filter(m => m.type === "RPP").length, icon: FileText, color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
    { label: "PPT", count: materials.filter(m => m.type === "PPT").length, icon: Presentation, color: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
    { label: "Soal", count: materials.filter(m => m.type === "QUESTIONS").length, icon: ClipboardList, color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
    { label: "LKPD", count: materials.filter(m => m.type === "LKPD").length, icon: BookOpen, color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
  ];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/materials`);
      const fetchedData = response.data.data || response.data || [];
      setMaterials(fetchedData);
    } catch (err) {
      console.warn("Backend unavailable, using mock data", err);
      setMaterials([
        { id: "1", title: "RPP Hukum Newton", type: "RPP", createdAt: "2024-01-20", isPublished: true, metadata: { mata_pelajaran: "Fisika", jenjang: "Kelas 10", kurikulum: "kurikulum_merdeka", topic: "Hukum Newton tentang Gerak" } },
        { id: "2", title: "PPT Integral Tak Tentu", type: "PPT", createdAt: "2024-01-18", isPublished: true, metadata: { mata_pelajaran: "Matematika", jenjang: "Kelas 12", kurikulum: "kurikulum_merdeka", topic: "Integral Tak Tentu" } },
        { id: "3", title: "Soal UTS Kimia", type: "QUESTIONS", createdAt: "2024-02-05", isPublished: true, metadata: { mata_pelajaran: "Kimia", jenjang: "Kelas 11", kurikulum: "kurikulum_2013" } },
        { id: "4", title: "LKPD Genetika", type: "LKPD", createdAt: "2024-02-10", isPublished: false, metadata: { mata_pelajaran: "Biologi", jenjang: "Kelas 12", kurikulum: "kurikulum_merdeka" } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
      return;
    }

    try {
      await api.delete(`/materials/${materialId}`);
      toast({
        title: "Berhasil",
        description: "Materi berhasil dihapus.",
      });
      fetchMaterials();
      setDetailOpen(false);
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus materi.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (materialId: string, newStatus: boolean) => {
    try {
      await api.put(`/materials/${materialId}`, { isPublished: newStatus });
      toast({
        title: "Berhasil",
        description: `Status berhasil diubah ke ${newStatus ? "Published" : "Not Published"}.`,
      });
      fetchMaterials();
      if (selectedMaterial && selectedMaterial.id === materialId) {
        setSelectedMaterial({ ...selectedMaterial, isPublished: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (material: Material) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "File tidak tersedia untuk diunduh.",
        variant: "destructive",
      });
    }
  };

  const openDetail = (material: Material) => {
    setSelectedMaterial(material);
    setDetailOpen(true);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
      if (isValid(date)) {
        return format(date, "yyyy-MM-dd");
      }
      return "-";
    } catch (e) {
      return "-";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "RPP": return <FileText className="h-5 w-5 text-white" />;
      case "PPT": return <Presentation className="h-5 w-5 text-white" />;
      case "QUESTIONS": return <ClipboardList className="h-5 w-5 text-white" />;
      case "LKPD": return <BookOpen className="h-5 w-5 text-white" />;
      default: return <FileText className="h-5 w-5 text-white" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "RPP": return "bg-blue-500";
      case "PPT": return "bg-purple-500";
      case "QUESTIONS": return "bg-green-500";
      case "LKPD": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === "QUESTIONS") return "Soal";
    return type;
  };

  const formatKurikulum = (kurikulum?: string) => {
    if (!kurikulum) return "-";
    switch (kurikulum) {
      case "kurikulum_merdeka": return "Kurikulum Merdeka";
      case "kurikulum_2013": return "Kurikulum 2013";
      case "cambridge": return "Cambridge";
      case "international_baccalaureate": return "International Baccalaureate";
      default: return kurikulum;
    }
  };

  const getSubject = (material: Material) => {
    return material.metadata?.mata_pelajaran || "-";
  };

  const getGrade = (material: Material) => {
    return material.metadata?.jenjang || "-";
  };

  const getTopic = (material: Material) => {
    if (!material) return "-";
    return material.metadata?.topic || material.title?.replace(/^(RPP|PPT|Soal|LKPD)\s*-?\s*/i, "") || "-";
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSubject(m).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    const matchesStatus = statusFilter === "all_status" ||
      (statusFilter === "published" && m.isPublished) ||
      (statusFilter === "draft" && !m.isPublished);
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{stat.count}</h3>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter Container */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari materi..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-gray-50 border-gray-200">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="RPP">RPP</SelectItem>
                  <SelectItem value="PPT">PPT</SelectItem>
                  <SelectItem value="QUESTIONS">Soal</SelectItem>
                  <SelectItem value="LKPD">LKPD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_status">Semua Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Not Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material List */}
      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold text-gray-700">Materi</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Tipe</TableHead>
                <TableHead className="font-semibold text-gray-700">Mapel / Kelas</TableHead>
                <TableHead className="font-semibold text-gray-700">Kurikulum</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Tanggal</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    Tidak ada materi ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow
                    key={material.id}
                    className="hover:bg-gray-50/50 cursor-pointer group"
                    onClick={() => openDetail(material)}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getIconBg(material.type)} shrink-0 mt-0.5`}>
                          {getIcon(material.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{material.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{getTopic(material)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="border-gray-400 rounded-full bg-white text-black font-normal hover:bg-white">
                        {getTypeLabel(material.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{getSubject(material)}</span>
                        <span className="text-xs text-gray-500">{getGrade(material)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-600 hover:bg-green-700">
                        {formatKurikulum(material.metadata?.kurikulum)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${material.isPublished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} font-normal`}>
                        {material.isPublished ? "Published" : "Not Published"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(material.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem className="gap-2" onClick={() => openDetail(material)}>
                            <Eye className="h-4 w-4" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-xl ${getIconBg(selectedMaterial?.type || "")} shrink-0`}>
                {getIcon(selectedMaterial?.type || "")}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {selectedMaterial?.title}
                </DialogTitle>
                <p className="text-gray-500 text-sm mt-1">Detail materi dan pengaturan</p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Detail Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Topik</p>
                <p className="font-medium text-gray-900">{getTopic(selectedMaterial || {} as Material)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Mata Pelajaran</p>
                <p className="font-medium text-gray-900">{getSubject(selectedMaterial || {} as Material)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Kelas</p>
                <p className="font-medium text-gray-900">{getGrade(selectedMaterial || {} as Material)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Kurikulum</p>
                <p className="font-medium text-gray-900">{formatKurikulum(selectedMaterial?.metadata?.kurikulum)}</p>
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Status Publikasi</p>
              <Select
                value={selectedMaterial?.isPublished ? "published" : "not_published"}
                onValueChange={(val) => {
                  if (selectedMaterial) {
                    handleStatusChange(selectedMaterial.id, val === "published");
                  }
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Published
                    </div>
                  </SelectItem>
                  <SelectItem value="not_published">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Not Published
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-gradient-to-r from-[#6ACBE0] to-[#85E0A3] hover:opacity-90 text-white"
                onClick={() => handleDownload(selectedMaterial!)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(selectedMaterial!.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
