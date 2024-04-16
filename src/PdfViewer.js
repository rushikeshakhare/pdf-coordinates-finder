import React, { useState, useEffect, useCallback } from "react";
import * as pdfjs from "pdfjs-dist/webpack"; // Import PDF.js modules
import "./PdfViewer.css";

const PdfViewer = () => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfPage, setPdfPage] = useState(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  }, []);

  const renderPdf = async () => {
    try {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setNumPages(null);
    }
  };

  useEffect(() => {
    if (pdfDocument) {
      pdfDocument.getPage(currentPage).then((page) => {
        setPdfPage(page);
      });
    }
  }, [pdfDocument, currentPage]);

  const handlePdfClick = useCallback(
    (event) => {
      const { offsetX, offsetY } = event.nativeEvent;

      if (pdfPage) {
        const viewport = pdfPage.getViewport({ scale: 1 });
        const pdfX = (offsetX * viewport.width) / event.target.width;
        const pdfY =
          ((event.target.height - offsetY) * viewport.height) /
          event.target.height;

        setCoordinates({ x: pdfX, y: pdfY });

        // Get canvas context
        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.style.border = "1px solid red";
        overlayCanvas.width = event.target.width;
        overlayCanvas.height = event.target.height;
        const context = overlayCanvas.getContext("2d");

        // Draw the existing PDF canvas onto the overlay canvas
        context.drawImage(event.target, 0, 0);

        // Draw rectangle around the clicked area
        const rectWidth = 5; // Adjust rectangle width as needed
        const rectHeight = 5; // Adjust rectangle height as needed
        context.strokeStyle = "blue"; // Set rectangle border color to yellow
        context.lineWidth = 2; // Set rectangle border width
        context.strokeRect(
          offsetX - rectWidth / 2,
          offsetY - rectHeight / 2,
          rectWidth,
          rectHeight
        );

        // Draw coordinates text
        const text = `Page Number: ${currentPage} , X: ${pdfX.toFixed(
          2
        )}, Y: ${pdfY.toFixed(2)}`;
        const textWidth = context.measureText(text).width;
        const padding = 50;
        context.fillStyle = "black"; // Background color
        context.fillRect(offsetX, offsetY - 12, textWidth + 2 * padding, 20); // Adjust rectangle position and size
        context.font = "bold 13px Arial";
        context.fillStyle = "yellow"; // Text color
        context.fillText(text, offsetX + 5, offsetY); // Adjust text position

        const outputNode = document.getElementById("outputs");
        outputNode.appendChild(overlayCanvas);
        // parent.replaceChild(overlayCanvas, event.target);
      }
    },
    [pdfPage, currentPage]
  );

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <div className="pdf-container">
        <div>
          <input
            type="text"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="Enter PDF URL"
            style={{ width: "200px" }}
          />
          <button style={{ marginLeft: "10px" }} onClick={renderPdf}>
            Render PDF
          </button>
        </div>
        {pdfPage && (
          <div>
            <canvas
              className="pdf-page"
              id="hello"
              onClick={handlePdfClick}
              width={600}
              height={800}
              style={{ border: "1px solid black" }}
              ref={(canvas) => {
                if (canvas) {
                  const context = canvas.getContext("2d");
                  const viewport = pdfPage.getViewport({ scale: 1.5 });
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;

                  pdfPage.render({
                    canvasContext: context,
                    viewport: viewport,
                  });
                }
              }}
            />
          </div>
        )}
        {pdfPage && (
          <div className="pagination">
            <button onClick={goToPreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button onClick={goToNextPage} disabled={currentPage === numPages}>
              Next
            </button>
          </div>
        )}
      </div>
      <div id="outputs" />
    </>
  );
};

export default PdfViewer;
