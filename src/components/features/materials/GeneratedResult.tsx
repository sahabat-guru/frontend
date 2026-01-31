"use client";

import { useMemo } from "react";
import { FileJson, Save, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GeneratedResultProps {
  result: any;
  type: "RPP" | "PPT" | "LKPD" | "QUESTIONS" | null;
}

export function GeneratedResult({ result, type }: GeneratedResultProps) {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <FileText className="h-16 w-16 text-gray-300" />
          <p className="text-gray-500 font-medium">
            {type === "RPP" ? "Klik \"Generate RPP\" untuk melihat hasil" : "Klik Generate untuk melihat hasil"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${type !== "RPP" ? "bg-card rounded-lg border shadow-sm" : ""}`}>
      <div className={`p-4 flex items-center ${type === "RPP" ? "justify-end" : "justify-between border-b bg-muted/30"}`}>
        {type !== "RPP" && (
          <div className="flex items-center gap-2 font-semibold">
            <FileJson className="h-5 w-5 text-secondary" />
            Preview Result
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Visual Preview</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="prose dark:prose-invert max-w-none">
            <div className="p-6 bg-white dark:bg-card rounded-lg border shadow-sm min-h-[300px]">
              {/* Dynamic preview based on type */}
              {type === "RPP" && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{result.title || "Rencana Pelaksanaan Pembelajaran"}</h3>
                  {/* Render RPP specific fields if available in result */}
                  <div className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</div>
                </div>
              )}
              {type === "PPT" && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{result.title || "Presentation Slides"}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {result.contentJson?.total_slides && (
                      <p>Total Slides: {result.contentJson.total_slides}</p>
                    )}
                    {/* Placeholder for slides */}
                    <div className="aspect-video bg-gray-200 flex items-center justify-center rounded">
                      Slides Preview
                    </div>
                  </div>
                </div>
              )}
              {type === "QUESTIONS" && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{result.title || "Latihan Soal"}</h3>
                  <ol className="list-decimal pl-5 space-y-4">
                    {result.contentJson?.questions && Array.isArray(result.contentJson.questions) ? (
                      result.contentJson.questions.map((q: any, i: number) => (
                        <li key={i} className="pl-2">
                          <p className="font-medium">{q.question || q.soal}</p>
                          {/* Options if MC */}
                        </li>
                      ))
                    ) : (
                      <p>No questions data to display.</p>
                    )}
                  </ol>
                </div>
              )}
              {/* Fallback */}
              {!["RPP", "PPT", "QUESTIONS"].includes(type || "") && (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </TabsContent>
          <TabsContent value="json">
            <pre className="text-xs font-mono p-4 bg-slate-950 text-green-400 rounded-lg overflow-auto max-h-[500px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
