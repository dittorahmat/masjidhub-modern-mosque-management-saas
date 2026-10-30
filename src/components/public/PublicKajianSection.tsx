import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, User, ExternalLink, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KajianVideo } from '@shared/types';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';

interface PublicKajianSectionProps {
  kajianVideos: KajianVideo[];
  activeVideo: KajianVideo | null;
  setActiveVideo: (video: KajianVideo | null) => void;
}

export function PublicKajianSection({
  kajianVideos,
  activeVideo,
  setActiveVideo,
}: PublicKajianSectionProps) {
  if (kajianVideos.length === 0) return null;

  return (
    <section className="space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider">
          <Youtube className="h-4 w-4" /> Video Kajian YouTube
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold">
          Rekaman Kajian Ilmiah
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Tonton rekaman ceramah, pengajian tafsir, dan kajian tematik dari asatidz masjid kami kapan saja.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {kajianVideos.map((video) => {
          const thumb =
            video.thumbnailUrl ||
            `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Card className="illustrative-card overflow-hidden h-full flex flex-col group p-0 border-none shadow-none hover:shadow-xl hover:translate-y-[-2px] transition-all bg-white rounded-3xl">
                {/* Video Thumbnail */}
                <div className="aspect-video w-full overflow-hidden relative bg-stone-900">
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

                  {video.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{video.duration}</span>
                    </div>
                  )}

                  {video.category && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 backdrop-blur-md text-stone-900 border-none font-bold text-[10px] px-2.5 py-1 rounded-full shadow-sm capitalize">
                        {video.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveVideo(video)}
                    aria-label={`Tonton ${video.title}`}
                    className="absolute inset-0 flex items-center justify-center group/btn"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover/btn:scale-110 transition-transform duration-300">
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white ml-0.5" />
                    </div>
                  </button>
                </div>

                {/* Video Info */}
                <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>

                    {video.ustadzName && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{video.ustadzName}</span>
                      </div>
                    )}

                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="pt-3 border-t flex items-center justify-between gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActiveVideo(video)}
                      className="rounded-full text-xs font-bold gap-1.5 min-h-[44px] h-10 px-5 shadow-sm"
                    >
                      <Play className="h-3 w-3 fill-current" /> Tonton Video
                    </Button>

                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors min-h-[44px]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>YouTube</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Responsive Video Modal */}
      <ResponsiveDialog
        open={!!activeVideo}
        onOpenChange={(open) => !open && setActiveVideo(null)}
      >
        <ResponsiveDialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none bg-stone-950 text-white">
          <ResponsiveDialogHeader className="p-4 sm:p-6 pb-2 text-left">
            <div className="flex items-center justify-between gap-4">
              <Badge className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
                {activeVideo?.category?.replace('_', ' ') || 'Kajian'}
              </Badge>
              {activeVideo && (
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1 min-h-[36px]"
                >
                  Buka di YouTube <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <ResponsiveDialogTitle className="text-lg sm:text-2xl font-display font-bold mt-2 text-white">
              {activeVideo?.title}
            </ResponsiveDialogTitle>
            {activeVideo?.ustadzName && (
              <ResponsiveDialogDescription className="text-stone-300 font-semibold flex items-center gap-1.5 pt-1">
                <User className="h-4 w-4 text-primary" /> {activeVideo.ustadzName}
              </ResponsiveDialogDescription>
            )}
          </ResponsiveDialogHeader>

          {/* YouTube Responsive Embed */}
          <div className="relative aspect-video w-full bg-black">
            {activeVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            )}
          </div>

          {activeVideo?.description && (
            <div className="p-4 sm:p-6 pt-3 text-xs sm:text-sm text-stone-400 leading-relaxed max-h-36 overflow-y-auto">
              <p className="font-bold text-stone-200 mb-1">Ringkasan Materi:</p>
              {activeVideo.description}
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </section>
  );
}
