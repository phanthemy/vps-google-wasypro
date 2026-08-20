import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Star, GripVertical } from 'lucide-react';

interface UploadedImage {
  url: string;
  thumbnail?: string;
  originalName?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];  // Current images
  mainImage: string;        // Main product image URL
  onImagesChange: (images: UploadedImage[]) => void;
  onMainImageChange: (url: string) => void;
  maxImages?: number;       // Default 6
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    error?: string;
    file: File;
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  mainImage,
  onImagesChange,
  onMainImageChange,
  maxImages = 6
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return 'Chỉ chấp nhận .jpg, .png, .webp, .mp4, .webm';
    }
    const isVideoFile = file.type.startsWith('video/');
    const maxSize = isVideoFile ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return isVideoFile ? 'Video tối đa 50MB' : 'Ảnh tối đa 5MB';
    }
    return null;
  };

  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  const uploadFile = (file: File, id: string) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('images', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress((prev) => ({
            ...prev,
            [id]: { ...prev[id], progress }
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.images && response.images.length > 0) {
              const newImage = response.images[0];
              onImagesChange([...images, newImage]);
              if (images.length === 0 && !mainImage) {
                onMainImageChange(newImage.url);
              }
              setUploadProgress((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
              resolve();
            } else {
              throw new Error(response.message || 'Upload failed');
            }
          } catch (error) {
            setUploadProgress((prev) => ({
              ...prev,
              [id]: { ...prev[id], error: 'Lỗi phản hồi từ server', progress: 0 }
            }));
            reject(error);
          }
        } else {
          setUploadProgress((prev) => ({
            ...prev,
            [id]: { ...prev[id], error: 'Lỗi upload server', progress: 0 }
          }));
          reject(new Error('Upload server error'));
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress((prev) => ({
          ...prev,
          [id]: { ...prev[id], error: 'Lỗi mạng khi upload', progress: 0 }
        }));
        reject(new Error('Network error'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const filesArray = Array.from(files);
    
    if (images.length + filesArray.length > maxImages) {
      setGlobalError(`Bạn chỉ có thể tải lên tối đa ${maxImages} hình ảnh.`);
      return;
    }

    filesArray.forEach((file) => {
      const error = validateFile(file);
      const tempId = Math.random().toString(36).substring(7);

      if (error) {
        setUploadProgress((prev) => ({
          ...prev,
          [tempId]: { file, progress: 0, error }
        }));
        return;
      }

      setUploadProgress((prev) => ({
        ...prev,
        [tempId]: { file, progress: 0 }
      }));

      uploadFile(file, tempId).catch(console.error);
    });
  }, [images, maxImages, onImagesChange, onMainImageChange, mainImage]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const removedImage = images[indexToRemove];
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(newImages);
    
    if (mainImage === removedImage.url) {
      onMainImageChange(newImages.length > 0 ? newImages[0].url : '');
    }
  };

  const setMain = (url: string) => {
    onMainImageChange(url);
  };

  const removeUploadProgress = (id: string) => {
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-ocean-500 bg-ocean-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp, video/mp4, video/webm"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />
        <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm text-slate-300 font-medium">Kéo thả hình ảnh/video hoặc click để chọn</p>
        <p className="text-xs text-slate-500 mt-1">Ảnh: .jpg, .png, .webp (5MB) | Video: .mp4, .webm (50MB)</p>
        <p className="text-xs text-ocean-400 mt-2 flex items-center justify-center gap-1">
           Hình ảnh tự động nén, video giữ nguyên chất lượng
        </p>
      </div>

      {globalError && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div key={`img-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-square">
            {isVideoUrl(img.url) ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎬</div>
                  <span className="text-[10px] text-slate-400">Video</span>
                </div>
              </div>
            ) : (
              <img 
                src={img.thumbnail || img.url} 
                alt={img.originalName || `Image ${idx}`} 
                className="w-full h-full object-cover" 
              />
            )}
            
            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMain(img.url); }}
                className={`absolute top-2 left-2 p-1.5 rounded-full transition-colors 
                  ${mainImage === img.url ? 'bg-yellow-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
                title="Đặt làm ảnh chính"
              >
                <Star className="w-4 h-4" fill={mainImage === img.url ? "currentColor" : "none"} />
              </button>
              
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Main Badge */}
            {mainImage === img.url && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500 text-xs font-bold rounded shadow text-white">
                Ảnh chính
              </div>
            )}
          </div>
        ))}

        {/* Uploading Progress */}
        {Object.entries(uploadProgress).map(([id, upload]) => (
          <div key={id} className="relative rounded-xl border border-slate-700 bg-slate-800 aspect-square flex flex-col items-center justify-center p-4">
             {upload.error ? (
                <>
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-xs text-red-400 text-center">{upload.error}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeUploadProgress(id); }}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
             ) : (
                <>
                  <Loader2 className="w-8 h-8 text-ocean-500 animate-spin mb-2" />
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-ocean-500 h-full transition-all duration-300" 
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{upload.progress}%</p>
                </>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
