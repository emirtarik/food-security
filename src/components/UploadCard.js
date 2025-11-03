// src/components/UploadCard.js
import React from 'react';

export default function UploadCard({
  file,
  status,
  message,
  progress,
  uploadedKey,
  onPickFile,
  onChooseFile,
  onDropFile,
  onUpload,
  onRemoveFile,
  inputRef,
}) {
  const readableSize = (n) => {
    if (!n && n !== 0) return '-';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="bg-white rounded-xl shadow-lg border border-[#d9d7c8] overflow-hidden">
      {/* Card header */}
      <div className="border-b border-[#d9d7c8] bg-[#f6f5e9] px-6 py-5">
        <h1 className="text-xl font-semibold text-[#2f463f] text-center">
          Secure Document Submission
        </h1>
        <p className="text-center text-[#707070] text-[13px] mt-2 leading-relaxed max-w-2xl mx-auto">
          Upload official project material, situation reports, datasets or policy notes.
          Accepted formats: PDF, JPG, JPEG, PNG.
        </p>
      </div>

      {/* Card body */}
      <div className="px-6 py-8">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropFile}
          className="border-2 border-dashed border-[#d9d7c8] rounded-lg bg-white hover:bg-[#faf9f1] transition-colors px-6 py-10 text-center"
        >
          <div className="text-[#2f463f] font-medium text-sm">
            Drag & drop your file here
          </div>
          <div className="text-[#707070] text-xs mt-1 mb-4">
            or select from your computer
          </div>

          <button
            type="button"
            onClick={onPickFile}
            className="bg-[#316c41] text-white text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 transition-colors"
          >
            Choose a file
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={onChooseFile}
          />

          <div className="text-[11px] text-[#8a8a8a] mt-4 leading-relaxed">
            Please ensure documents do not contain personal data beyond what is
            strictly required.
          </div>
        </div>

        {/* Selected file details + actions */}
        {file && (
          <div className="mt-8 bg-[#f9f8ef] border border-[#d9d7c8] rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* File info */}
              <div className="min-w-0">
                <div className="text-[#2f463f] font-medium text-[14px] truncate">
                  {file.name}
                </div>
                <div className="text-[12px] text-[#707070] mt-1">
                  {file.type || 'Unknown type'} • {readableSize(file.size)}
                </div>

                {/* Progress bar */}
                {(status === 'uploading' || progress > 0) && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-[#e8e7dc] rounded">
                      <div
                        className="h-2 bg-[#316c41] rounded"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-[#707070] mt-1">
                      {Math.min(progress, 100)}%
                    </div>
                  </div>
                )}

                {/* Success details */}
                {status === 'success' && uploadedKey && (
                  <div className="mt-3">
                    <div className="text-[13px] text-[#316c41] font-medium">
                      File successfully received.
                    </div>
                    <div className="text-[11px] text-[#707070] break-all mt-1">
                      Storage key: <span className="font-mono">{uploadedKey}</span>
                    </div>
                    <div className="text-[11px] text-[#707070] mt-1">
                      Document is pending internal validation before publication.
                    </div>
                  </div>
                )}

                {/* Message / error */}
                {message && (
                  <div
                    className={`mt-3 text-[12px] leading-relaxed ${
                      status === 'error' ? 'text-red-700' : 'text-[#2f463f]'
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-row md:flex-col gap-3 shrink-0">
                <button
                  onClick={onUpload}
                  disabled={status === 'uploading'}
                  className="bg-[#316c41] text-white text-xs font-medium rounded-md px-4 py-2 text-center hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'uploading' ? `Uploading ${progress}%` : 'Upload'}
                </button>

                <button
                  onClick={onRemoveFile}
                  disabled={status === 'uploading'}
                  className="border border-[#d9d7c8] bg-white text-[#2f463f] text-xs font-medium rounded-md px-4 py-2 text-center hover:bg-[#faf9f1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom policy note */}
        <div className="text-[11px] text-[#8a8a8a] text-center mt-10 leading-relaxed max-w-xl mx-auto">
          This service is intended for internal contributors. By submitting a file,
          you confirm that you have the right to share its contents and that it is
          relevant to the Food Security Knowledge Platform.
        </div>
      </div>
    </section>
  );
}
