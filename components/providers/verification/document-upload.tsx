import { useState } from "react";
import { Upload, X, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DocumentUploadProps {
  label: string;
  required?: boolean;
  onUploadComplete: (url: string) => void;
  providerId: string;
  existingUrl?: string;
}

export default function DocumentUpload({
  label,
  required = false,
  onUploadComplete,
  providerId,
  existingUrl,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(!!existingUrl);

  const validateFile = async (selectedFile: File): Promise<string | null> => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      return "Only JPG, PNG, or PDF files are allowed";
    }

    if (selectedFile.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(selectedFile);
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (img.width < 800 || img.height < 600) {
            resolve("Image must be at least 800x600 pixels for clarity");
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve("Unable to read image file");
        };
        img.src = url;
      });
    }

    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setUploadSuccess(false);

    const validationError = await validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview("PDF_FILE");
    }

    // AUTO-UPLOAD immediately after selection
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      const fileExt = fileToUpload.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${providerId}/${timestamp}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("verification-documents")
        .upload(fileName, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw new Error(error.message || "Upload failed");

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(fileName);

      onUploadComplete(publicUrl);
      setUploadSuccess(true);
      setError(null);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
      setFile(null);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    setUploadSuccess(false);
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadSuccess && !error && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <FileCheck className="h-4 w-4 flex-shrink-0" />
          <span>✓ Document uploaded successfully!</span>
        </div>
      )}

      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, "-")}`}
            disabled={uploading}
          />
          <label
            htmlFor={`upload-${label.replace(/\s+/g, "-")}`}
            className={`cursor-pointer flex flex-col items-center ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-blue-500 mb-2 animate-spin" />
                <p className="text-sm text-gray-600 font-medium">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or PDF (max 5MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 800x600 pixels recommended
                </p>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="relative">
          {preview === "PDF_FILE" ? (
            <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <FileCheck className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
                {uploading && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-blue-600">Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-contain bg-gray-50 rounded-lg border-2 border-gray-300"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Uploading...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!uploading && (
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {uploading
          ? "Please wait while we upload your document..."
          : "Ensure the document is clear, well-lit, and all text is readable"}
      </p>
    </div>
  );
}
