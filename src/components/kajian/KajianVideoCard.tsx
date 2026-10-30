import React from 'react';
import type { KajianVideo } from '@shared/types';
import { Play, ExternalLink, Trash2, Clock, User, Tag, Youtube } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getYoutubeThumbnailUrl } from '@shared/youtube';

interface KajianVideoCardProps {
  video: KajianVideo;
  canManage: boolean;
  onPlay: (video: KajianVideo) => void;
  onDelete: (id: string, title: string) => void;
  isDeleting?: boolean;
}

export function KajianVideoCard({
  video,
  canManage,
  onPlay,
  onDelete,
  isDeleting,
}: KajianVideoCardProps) {
  const thumbUrl = video.thumbnailUrl || (video.youtubeVideoId ? getYoutubeThumbnailUrl(video.youtubeVideoId) : '');

  return (
    <Card className="group overflow-hidden border-stone-200/80 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl flex flex-col">
      {/* Thumbnail Banner */}
      <div className="relative aspect-video w-full bg-stone-900 overflow-hidden cursor-pointer" onClick={() => onPlay(video)}>
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
            <Youtube className="w-12 h-12 text-rose-500 opacity-60" />
          </div>
        )}

        {/* Dark Overlay with Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1 shadow">
            <Clock className="w-3 h-3 text-stone-300" />
            <span>{video.duration}</span>
          </div>
        )}

        {/* Category Badge */}
        {video.category && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant="secondary" className="bg-stone-900/85 backdrop-blur-sm text-white text-[11px] font-normal border-0 shadow">
              <Tag className="w-2.5 h-2.5 mr-1 text-emerald-400" />
              {video.category.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 
            className="font-bold text-stone-900 line-clamp-2 text-base leading-snug group-hover:text-primary transition-colors cursor-pointer"
            onClick={() => onPlay(video)}
            title={video.title}
          >
            {video.title}
          </h3>

          {video.ustadzName && (
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{video.ustadzName}</span>
            </div>
          )}

          {video.description && (
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Actions Bottom Bar */}
        <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs font-semibold gap-1.5 shadow-sm rounded-lg"
              onClick={() => onPlay(video)}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tonton
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-normal text-stone-600 hover:text-rose-600 gap-1 rounded-lg"
              asChild
            >
              <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                YouTube
              </a>
            </Button>
          </div>

          {canManage && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              disabled={isDeleting}
              onClick={() => onDelete(video.id, video.title)}
              title="Hapus rekaman kajian"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
