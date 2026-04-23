

// src/components/CustomerVersionReview.tsx
"use client";

import { useState } from "react";


type Deliverable = {
  id: string;
  name: string;
  url: string;
  fileKey: string | null;
  fileSize: number | null;
  createdAt: Date;
};

type Phase = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deliverables: Deliverable[];
};

type Props = {
  projectId: string;
  customerId: string;
  phases: Phase[];
  onReviewComplete?: () => void;
};

export default function CustomerVersionReview({ 

  phases,
  onReviewComplete 
}: Props) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.map(p => p.id)));

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 交付成品</h3>
        <p className="text-sm text-blue-700">
          您可以在此查看各階段 PM 提供的正式交付成品。
        </p>
      </div>

      {/* 階段列表 */}
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 階段標題 */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {expandedPhases.has(phase.id) ? "▼" : "▶"}
                </span>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                  {phase.description && (
                    <p className="text-sm text-gray-500">{phase.description}</p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full ${
                phase.status === "COMPLETED" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {phase.status === "COMPLETED" ? "已完成" : "進行中"}
              </span>
            </button>

            {/* 階段內的交付成品列表 */}
            {expandedPhases.has(phase.id) && (
              <div className="p-4 space-y-3">
                {phase.deliverables.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">暫無交付成品</p>
                ) : (
                  <div className="space-y-2">
                    {phase.deliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="border border-green-100 rounded-lg p-4 bg-green-50/30 hover:bg-green-50 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {deliverable.name}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              正式交付
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            提供於 {new Date(deliverable.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400">
                            類型：{deliverable.url?.startsWith('http') ? '外部連結' : '檔案'}
                          </span>
                          {deliverable.url && (
                            <a
                              href={deliverable.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              查看成品 →
                            </a>
                          )}
                        </div>

                        {deliverable.fileSize && (
                          <div className="mt-2 text-xs text-gray-400">
                            檔案大小：{(deliverable.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}