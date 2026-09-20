import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import "./NewsModal.css";
import ReactDOM from "react-dom";

// Modal component to display news article previews using React Portals
export default function NewsModal({ article, onClose }) {
  const overlayRef = useRef(null);

  // Close the modal when the Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (article) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  const externalUrl = article.link || article.url;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleLinkClick = (e, url) => {
    if (!url || url === "#") return;
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      id="newsModal"
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOverlayClick(e);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="modal-content">
        <button id="closeModalBtn" className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 id="modalTitle" className="modal-title">
          {article.title}
        </h2>
        <div className="modal-meta">
          <span>Read article on </span>
          <strong id="modalPublisher">{article.publisher}</strong>
          <a
            id="modalExternalLink"
            href={externalUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Open external article"
            className="modal-export-link"
            onClick={(e) => handleLinkClick(e, externalUrl)}
            style={{ cursor: "pointer" }}
          >
            <ExternalLink className="export-icon" />
          </a>
        </div>
        <div className="modal-body">
          {(() => {
            if (!article.summary) {
              return (
                <p id="modalSummary" className="modal-summary-empty">
                  A preview summary is not available for this article.{" "}
                  <a
                    href={externalUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more-inline"
                    onClick={(e) => handleLinkClick(e, externalUrl)}
                    style={{ cursor: "pointer" }}
                  >
                    Read the full article on {article.publisher}
                  </a>
                </p>
              );
            }

            const singleCutoffRegex = /[\s[\]]*(?:\.{3,}|\u2026|…|Read\s+(?:full\s+)?article|Read\s+More)[\s[\]]*$/i;
            let cleanSummary = article.summary;
            let hasCutoff = false;
            
            while (singleCutoffRegex.test(cleanSummary)) {
              hasCutoff = true;
              cleanSummary = cleanSummary.replace(singleCutoffRegex, "");
            }
            cleanSummary = cleanSummary.trimEnd();

            return (
              <p id="modalSummary">
                {cleanSummary}
                {hasCutoff && (
                  <a
                    href={externalUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="read-more-inline"
                    onClick={(e) => handleLinkClick(e, externalUrl)}
                    style={{ cursor: "pointer" }}
                  >
                    ... [Read full article]
                  </a>
                )}
              </p>
            );
          })()}
        </div>
      </div>
    </div>,
    document.body,
  );
}
