import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export default function ImageCropModal({ imageSrc, onCropComplete, onClose }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteInit = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const finishCrop = async () => {
        if (!croppedAreaPixels) return;
        setProcessing(true);
        try {
            // 1. Core Canvas Extraction
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const bBoxWidth = image.width;
            const bBoxHeight = image.height;

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            // 2. Blob extraction
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg');
            });

            if (!blob) throw new Error('Canvas is empty');

            // 3. Compression (1-3MB Target)
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(blob, options);

            // 4. Return as DataURL to match previous architecture
            const reader = new FileReader();
            reader.onloadend = () => {
                onCropComplete(reader.result);
            };
            reader.readAsDataURL(compressedFile);

        } catch (e) {
            console.error(e);
            alert('Error cropping image. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col h-[100dvh] w-full">
            <header className="shrink-0 bg-surface border-b-technical p-4 flex justify-between items-center z-10">
                <h2 className="font-headline-sm text-on-background uppercase">&gt; TARGET_ALIGNMENT</h2>
                <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors font-label-caps p-2">
                    [ CANCEL ]
                </button>
            </header>

            <div className="relative flex-1 bg-black w-full h-full overflow-hidden">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteInit}
                    onZoomChange={onZoomChange}
                    objectFit="contain"
                    showGrid={true}
                    style={{
                        containerStyle: { background: '#000' },
                        cropAreaStyle: { border: '2px solid #250fc2' }
                    }}
                />
            </div>

            <div className="shrink-0 bg-surface border-t-technical p-6 flex flex-col gap-6 z-10">
                <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-on-surface-variant text-xs">ZOOM_LEVEL</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => {
                            setZoom(e.target.value)
                        }}
                        className="w-full accent-primary bg-technical h-1 cursor-pointer appearance-none outline-none"
                    />
                </div>

                <button
                    onClick={finishCrop}
                    disabled={processing}
                    className="w-full bg-primary text-on-primary font-label-caps py-4 transition-colors hover:bg-on-background disabled:opacity-50"
                >
                    {processing ? 'PROCESSING_ASSET...' : '[ CROP_AND_USE ]'}
                </button>
            </div>
        </div>
    );
}
