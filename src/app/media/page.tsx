"use client";

import { useState } from "react";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { Image as ImageIcon } from "lucide-react";

export default function MediaPage() {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);

  // Use a default workspace ID for now - in production this comes from context
  const workspaceId = "default";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Media Library</h1>
            <p className="text-slate-400">Manage your images and videos</p>
          </div>
          
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
          >
            <ImageIcon className="w-4 h-4" />
            Open Library
          </button>
        </div>

        {/* Selected Assets Preview */}
        {selectedAssets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-white mb-4">Selected Assets</h2>
            <div className="grid grid-cols-4 gap-4">
              {selectedAssets.map(asset => (
                <div key={asset.id} className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <MediaLibrary
          workspaceId={workspaceId}
          isOpen={showLibrary}
          onClose={() => setShowLibrary(false)}
          onSelect={setSelectedAssets}
          maxSelection={4}
        />
      </div>
    </div>
  );
}
