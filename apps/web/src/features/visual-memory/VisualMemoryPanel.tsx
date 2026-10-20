"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { chorus, chorusItem } from "@shared/motion/variants";
import { useAssets, useAddAsset, fileToDataUrl } from "./assets";

/**
 * Visual memory — capture screenshots/images into a project's memory (Phase 5).
 * Pick or drop an image → it's resized client-side, captioned, and stored. With a
 * vision key configured later, captures can be auto-analysed into design notes.
 */
export function VisualMemoryPanel({ projectId }: { projectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const assets = useAssets(projectId);
  const addAsset = useAddAsset(projectId);
  const [pending, setPending] = useState<{ name: string; src: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    try {
      const src = await fileToDataUrl(file);
      setPending({ name: file.name, src });
      setCaption("");
    } catch {
      setError("Couldn't read that image.");
    }
  }

  async function save() {
    if (!pending || addAsset.isPending) return;
    await addAsset.mutateAsync({ name: pending.name, src: pending.src, caption: caption.trim() });
    setPending(null);
    setCaption("");
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
        <span className="h-1.5 w-1.5 rounded-full bg-accent2" /> visual memory
      </div>

      {/* Dropzone / picker */}
      <Surface
        elevation="raised"
        className="cursor-pointer p-6 text-center transition-colors hover:border-white/20"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onPick(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? undefined)}
        />
        <p className="font-serif text-[16px] text-ink">Drop a screenshot, or click to choose</p>
        <p className="mt-1 font-mono text-[10px] text-ink4">PNG / JPG · resized automatically</p>
      </Surface>

      {error && <p className="mt-3 text-[12px] text-pink-400">{error}</p>}

      {/* Caption + save the pending capture */}
      {pending && (
        <Surface className="mt-3 flex items-center gap-3 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pending.src} alt={pending.name} className="h-14 w-20 rounded-md object-cover" />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void save()}
            placeholder="What is this? (a caption becomes memory)"
            className="flex-1 rounded-md border border-white/12 bg-base px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink4 focus:border-accent2"
          />
          <Button
            onClick={() => void save()}
            disabled={addAsset.isPending}
            className={`shrink-0 px-4 py-2 text-[13px] ${addAsset.isPending ? "opacity-50" : ""}`}
          >
            {addAsset.isPending ? "Saving…" : "Capture"}
          </Button>
        </Surface>
      )}

      {/* Gallery */}
      <div className="mt-5">
        {assets.data && assets.data.length === 0 && !pending && (
          <p className="py-6 text-center text-[13px] text-ink3">
            No visual memory yet. Capture a screenshot to start the project&rsquo;s visual record.
          </p>
        )}
        {assets.data && assets.data.length > 0 && (
          <motion.div
            variants={chorus}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {assets.data.map((a) => (
              <motion.figure key={a.id} variants={chorusItem}>
                <Surface className="overflow-hidden p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt={a.caption || a.name} className="aspect-video w-full object-cover" />
                  <figcaption className="p-3">
                    <p className="truncate text-[12.5px] text-ink">{a.caption || a.name}</p>
                    <p className="mt-1 font-mono text-[9.5px] text-ink4">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </figcaption>
                </Surface>
              </motion.figure>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
