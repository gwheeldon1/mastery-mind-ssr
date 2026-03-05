"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, RotateCcw, Check, Loader2 } from "lucide-react";

interface CapturedImage {
    id: string;
    dataUrl: string;
    file: File | null;
}

interface HandwrittenCaptureProps {
    onCapture: (images: CapturedImage[]) => void;
    maxImages?: number;
}

/**
 * Handwritten answer capture component.
 * Supports camera capture (MediaDevices API) and file upload.
 * Captures images of handwritten answers for OCR + AI grading.
 */
export function HandwrittenCapture({ onCapture, maxImages = 5 }: HandwrittenCaptureProps) {
    const [images, setImages] = useState<CapturedImage[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setShowCamera(true);
        } catch (err) {
            setCameraError("Could not access camera. Try uploading an image instead.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setShowCamera(false);
    }, []);

    const captureFromCamera = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            const newImage: CapturedImage = {
                id: `cam-${Date.now()}`,
                dataUrl,
                file,
            };
            setImages((prev) => {
                const updated = [...prev, newImage].slice(0, maxImages);
                onCapture(updated);
                return updated;
            });
        }, "image/jpeg", 0.85);
    }, [maxImages, onCapture]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const newImage: CapturedImage = {
                    id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    dataUrl: reader.result as string,
                    file,
                };
                setImages((prev) => {
                    const updated = [...prev, newImage].slice(0, maxImages);
                    onCapture(updated);
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    }, [maxImages, onCapture]);

    const removeImage = useCallback((id: string) => {
        setImages((prev) => {
            const updated = prev.filter((img) => img.id !== id);
            onCapture(updated);
            return updated;
        });
    }, [onCapture]);

    return (
        <div className="space-y-3">
            {/* Camera view */}
            {showCamera && (
                <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="aspect-[4/3] w-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3">
                        <button
                            onClick={captureFromCamera}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105"
                        >
                            <div className="h-10 w-10 rounded-full border-4 border-primary" />
                        </button>
                        <button
                            onClick={stopCamera}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            {!showCamera && (
                <div className="flex gap-2">
                    <button
                        onClick={startCamera}
                        disabled={images.length >= maxImages}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                        <Camera className="h-4 w-4" />
                        Take Photo
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={images.length >= maxImages}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                        <Upload className="h-4 w-4" />
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            )}

            {cameraError && (
                <p className="text-center text-xs text-red-500">{cameraError}</p>
            )}

            {/* Captured images grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                        <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border">
                            <img
                                src={img.dataUrl}
                                alt="Captured answer"
                                className="aspect-[4/3] w-full object-cover"
                            />
                            <button
                                onClick={() => removeImage(img.id)}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Status */}
            <p className="text-center text-xs text-muted-foreground">
                {images.length}/{maxImages} images captured
            </p>
        </div>
    );
}
