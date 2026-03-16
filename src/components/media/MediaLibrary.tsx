"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Image as ImageIcon, 
  Video, 
  X, 
  Upload, 
  Search,
  Tag,
  Trash2,
  Check,
  Loader2
} from "lucide-react";

interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  width?: number;
  height?: number;
  size: number;
  tags: string[];
  createdAt: string;
}

interface MediaLibraryProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  maxSelection?: number;
  acceptedTypes?: ('IMAGE' | 'VIDEO')[];
}

export function MediaLibrary({ 
  workspaceId, 
  isOpen, 
  onClose, 
  onSelect,
  maxSelection = 4,
  acceptedTypes = ['IMAGE', 'VIDEO']
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/media?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, fetchAssets]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Upload to your storage (Cloudflare R2, S3, etc.)
      // For now, create object URL
      const url = URL.createObjectURL(file);
      
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: file.name,
          url,
          type: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
          size: file.size
        })
      });

      return res.ok;
    });

    await Promise.all(uploadPromises);
    await fetchAssets();
    setIsUploading(false);
  };

  const toggleAssetSelection = (asset: MediaAsset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.find(a => a.id === asset.id);
      if (isSelected) {
        return prev.filter(a => a.id !== asset.id);
      }
      if (prev.length >= maxSelection) return prev;
      return [...prev, asset];
    });
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Delete this asset?')) return;
    
    try {
      const res = await fetch(`/api/media/${assetId}`, { method: 'DELETE' });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        setSelectedAssets(prev => prev.filter(a => a.id !== assetId));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !activeTag || asset.tags.includes(activeTag);
    const matchesType = acceptedTypes.includes(asset.type as any);
    return matchesSearch && matchesTag && matchesType;
  });

  const allTags = Array.from(new Set(assets.flatMap(a => a.tags)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Media Library</h2>
            <p className="text-sm text-slate-400">
              {selectedAssets.length} of {maxSelection} selected
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer transition-colors">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Upload</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-800 overflow-x-auto">
            <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !activeTag ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tag === activeTag ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>No media found</p>
              <p className="text-sm">Upload your first image or video</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map(asset => {
                const isSelected = selectedAssets.find(a => a.id === asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleAssetSelection(asset)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-violet-500 ring-2 ring-violet-500/20' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Preview */}
                    <div className="aspect-square bg-slate-800">
                      {asset.type === 'VIDEO' ? (
                        <video src={asset.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs truncate">{asset.name}</p>
                        <p className="text-slate-400 text-xs">
                          {asset.type === 'VIDEO' ? 'Video' : 'Image'} • {Math.round(asset.size / 1024)}KB
                        </p>
                      </div>
                    </div>

                    {/* Selection Check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Type Icon */}
                    <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg">
                      {asset.type === 'VIDEO' ? (
                        <Video className="w-3 h-3 text-white" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            {filteredAssets.length} items
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(selectedAssets);
                onClose();
              }}
              disabled={selectedAssets.length === 0}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all"
            >
              Use Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
