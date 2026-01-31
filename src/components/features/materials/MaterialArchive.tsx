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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Pencil,
  Copy,
  Download,
  History,
  Trash2,
  Archive,
  Calendar
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
  // Mock fields for UI
  subject?: string;
  grade?: string;
  curriculum?: string;
  status?: "Published" | "Not Published";
  subtitle?: string;
}

export function MaterialArchive() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all_status");

  const stats = [
    { label: "RPP", count: materials.filter(m => m.type === "RPP").length, icon: FileText, color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
    { label: "PPT", count: materials.filter(m => m.type === "PPT").length, icon: Presentation, color: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
    { label: "Soal", count: materials.filter(m => m.type === "QUESTIONS").length, icon: ClipboardList, color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
    { label: "LKPD", count: materials.filter(m => m.type === "LKPD").length, icon: BookOpen, color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
  ];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      try {
        const response = await axios.get(`${API_URL}/materials`);
        const fetchedData = response.data.data || response.data || [];

        // Enrich with mock data for UI demo
        const enrichedData = fetchedData.map((m: any) => ({
          ...m,
          subject: m.subject || "Matematika",
          grade: m.grade || "Kelas 10",
          curriculum: m.curriculum || "Kurikulum Merdeka",
          status: m.isPublished ? "Published" : "Not Published",
          subtitle: m.subtitle || "Deskripsi singkat materi..."
        }));

        setMaterials(enrichedData);
      } catch (err) {
        console.warn("Backend unavailable, using mock data", err);
        setMaterials([
          { id: "1", title: "RPP Hukum Newton", type: "RPP", createdAt: "2024-01-20", subject: "Fisika", grade: "X IPA", curriculum: "Kurikulum Merdeka", status: "Published", subtitle: "Hukum Newton tentang Gerak", isPublished: true },
          { id: "2", title: "PPT Integral Tak Tentu", type: "PPT", createdAt: "2024-01-18", subject: "Matematika", grade: "XII IPA", curriculum: "Kurikulum Merdeka", status: "Published", subtitle: "Integral Tak Tentu", isPublished: true },
          { id: "3", title: "Soal UTS Kimia", type: "QUESTIONS", createdAt: "2024-02-05", subject: "Kimia", grade: "XI IPA", curriculum: "K13", status: "Published", subtitle: "Reaksi Redoks", isPublished: true },
          { id: "4", title: "LKPD Genetika", type: "LKPD", createdAt: "2024-02-10", subject: "Biologi", grade: "XII IPA", curriculum: "Kurikulum Merdeka", status: "Not Published", subtitle: "Pewarisan Sifat", isPublished: false },
        ]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
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

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    const matchesStatus = statusFilter === "all_status" ||
      (statusFilter === "published" && m.status === "Published") ||
      (statusFilter === "draft" && m.status === "Not Published");
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
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari materi berdasarkan judul, topik, atau mapel..."
              className="pl-10 h-11 bg-white rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-11 bg-white rounded-xl">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="RPP">RPP</SelectItem>
                <SelectItem value="PPT">PPT</SelectItem>
                <SelectItem value="QUESTIONS">Soal</SelectItem>
                <SelectItem value="LKPD">LKPD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11 bg-white rounded-xl">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">Semua Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Material List Container */}
      <Card className="border shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-[#0F172A]">
            Daftar Materi ({filteredMaterials.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">Klik pada materi untuk melihat detail dan riwayat versi</p>
        </div>
        <CardContent className="p-4">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[30%]">Materi</TableHead>
                <TableHead className="text-center">Jenis</TableHead>
                <TableHead>Mapel / Kelas</TableHead>
                <TableHead>Kurikulum</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Terakhir Diubah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                  <TableRow key={material.id} className="hover:bg-gray-50/50 cursor-pointer group">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getIconBg(material.type)} shrink-0 mt-0.5`}>
                          {getIcon(material.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{material.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{material.subtitle}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-normal">
                        {getTypeLabel(material.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{material.subject}</span>
                        <span className="text-xs text-gray-500">{material.grade}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${material.curriculum === 'K13' ? 'bg-green-600' : 'bg-green-600'} hover:bg-green-700`}>
                        {material.curriculum}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${material.status === 'Published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} font-normal`}>
                        {material.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(material.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
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
      {/* End Material List Container */}
    </div>
  );
}
