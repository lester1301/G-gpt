import { useEffect, useState } from "react";
import { API_URL } from "../config";

function getFileIcon(mimeType) {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType?.includes("word")) return "📝";
  if (
    mimeType?.includes("sheet") ||
    mimeType?.includes("excel") ||
    mimeType === "text/csv"
  )
    return "📊";
  return "📃";
}

function Gallery({ isOpen, onClose, authToken, onOpenInChat }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !authToken) return;

    const loadAttachments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/attachments`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load files");
        }

        const data = await response.json();
        setAttachments(data.attachments || []);
      } catch (err) {
        setError("Couldn't load your files. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAttachments();
  }, [isOpen, authToken]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-modal gallery-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <h2>Gallery</h2>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close gallery"
          >
            ✕
          </button>
        </div>

        <div className="gallery-body">
          {loading && <p className="gallery-message">Loading your files...</p>}

          {!loading && error && <p className="gallery-message">{error}</p>}

          {!loading && !error && attachments.length === 0 && (
            <p className="gallery-message">
              No files yet — anything you attach in a chat will show up here.
            </p>
          )}

          {!loading && !error && attachments.length > 0 && (
            <div className="gallery-grid">
              {attachments.map((file, index) => (
                <div className="gallery-item" key={`${file.chatId}-${index}`}>
                  <div className="gallery-item-preview">
                    {file.mimeType?.startsWith("image/") && file.data ? (
                      <img
                        src={`data:${file.mimeType};base64,${file.data}`}
                        alt={file.name}
                      />
                    ) : (
                      <span className="gallery-item-icon">
                        {getFileIcon(file.mimeType)}
                      </span>
                    )}
                  </div>

                  <span className="gallery-item-name">{file.name}</span>
                  <span className="gallery-item-chat">{file.chatTitle}</span>

                  <button
                    type="button"
                    className="gallery-item-open-btn"
                    onClick={() => onOpenInChat(file.chatId)}
                  >
                    Open in chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Gallery;