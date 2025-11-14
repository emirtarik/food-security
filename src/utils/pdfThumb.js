// src/utils/pdfThumb.js
import * as pdfjsLib from "pdfjs-dist";
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/**
 * @param {Blob} pdfBlob
 * @param {number} scale
 * @returns {Promise<Blob>} PNG blob
 */
export async function pdfFirstPageToPNG(pdfBlob, scale = 1.0) {
  // Blob -> ArrayBuffer -> Uint8Array
  const buffer = await pdfBlob.arrayBuffer();
  const typedArray = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: typedArray });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const pngBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create PNG blob from canvas"));
      },
      "image/png"
    );
  });

  return pngBlob;
}

