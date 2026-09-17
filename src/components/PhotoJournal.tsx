import { useRef, useState, type KeyboardEvent } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { fanPhotos, photographer } from "../content/grantsor";
import FanPhoto from "./FanPhoto";
import { usePerformancePreferences } from "../hooks/usePerformancePreferences";
import "./PhotoJournal.css";

const memberFilters = Array.from(
  new Set(fanPhotos.flatMap((photo) => photo.members)),
);

export default function PhotoJournal() {
  const { prefersReducedMotion } = usePerformancePreferences();
  const [selectedMember, setSelectedMember] = useState("All photos");
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const visiblePhotos =
    selectedMember === "All photos"
      ? fanPhotos
      : fanPhotos.filter((photo) => photo.members.includes(selectedMember));
  const activeIndex = visiblePhotos.findIndex(
    (photo) => photo.id === activePhotoId,
  );
  const activePhoto = visiblePhotos[activeIndex];

  const movePhoto = (direction: number) => {
    if (!activePhoto || visiblePhotos.length < 2) return;
    const nextIndex =
      (activeIndex + direction + visiblePhotos.length) % visiblePhotos.length;
    setActivePhotoId(visiblePhotos[nextIndex].id);
  };

  const handleViewerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  };

  return (
    <section
      id="photo-journal"
      className="photo-journal journal-section"
      aria-labelledby="photo-journal-title"
    >
      <div className="journal-section-heading">
        <div>
          <p className="journal-kicker">The Manila collection</p>
          <h2 id="photo-journal-title">Manila, in focus.</h2>
        </div>
        <p>
          IVE Switch Manila fansign · July 12, 2024.
          <br />
          Photographs by{" "}
          <a
            href={photographer.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{photographer.name} ↗︎
          </a>
          , shared with permission.
        </p>
      </div>

      <div className="journal-toolbar">
        <div
          className="journal-filters"
          role="group"
          aria-label="Filter photos by member"
        >
          {["All photos", ...memberFilters].map((member) => (
            <button
              key={member}
              type="button"
              aria-pressed={selectedMember === member}
              onClick={() => setSelectedMember(member)}
            >
              {member}
            </button>
          ))}
        </div>
        <p
          className="journal-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {visiblePhotos.length}{" "}
          {visiblePhotos.length === 1 ? "photo" : "photos"}
          {selectedMember !== "All photos"
            ? ` · ${selectedMember}`
            : " · Manila"}
        </p>
      </div>

      <div className="journal-grid">
        {visiblePhotos.map((photo) => (
          <figure className="journal-photo-card" key={photo.id}>
            <button
              className="journal-photo-open"
              type="button"
              aria-label={`View ${photo.title} full size`}
              onClick={() => setActivePhotoId(photo.id)}
            >
              <FanPhoto
                photo={photo}
                sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
              <span className="journal-photo-expand" aria-hidden="true">
                ↗︎
              </span>
            </button>
            <figcaption>
              <div className="journal-photo-title">
                <h3>{photo.title}</h3>
                <span aria-hidden="true">
                  {String(
                    fanPhotos.findIndex((entry) => entry.id === photo.id) + 1,
                  ).padStart(2, "0")}
                </span>
              </div>
              <p>{photo.context}</p>
              <a
                className="journal-photo-credit"
                href={photo.postUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Photo © {photographer.name} · Original post ↗︎
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="journal-credit-note">
        <span className="journal-credit-symbol" aria-hidden="true">
          ©
        </span>
        <p>
          CTTO: all photos in this journal belong to {photographer.name} and are
          shared with permission for this non-commercial fan project. Original
          watermarks are preserved. Please credit the photographer when sharing.
        </p>
        <a
          className="journal-text-link"
          href={photographer.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit @{photographer.name} ↗︎
        </a>
      </div>

      <Modal
        motionPreset={prefersReducedMotion ? "none" : "scale"}
        isOpen={Boolean(activePhoto)}
        onClose={() => setActivePhotoId(null)}
        initialFocusRef={closeButtonRef}
        returnFocusOnClose
        size="4xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.88)" backdropFilter="blur(8px)" />
        <ModalContent
          className="journal-viewer"
          bg="#121217"
          color="#f6f3f5"
          mx={4}
          onKeyDown={handleViewerKeyDown}
        >
          <ModalHeader
            pr={14}
            fontWeight={500}
            fontSize={{ base: "lg", md: "xl" }}
          >
            {activePhoto?.title ?? "Fan photo"}
          </ModalHeader>
          <ModalCloseButton
            ref={closeButtonRef}
            aria-label="Close photo viewer"
          />
          <ModalBody pb={6}>
            {activePhoto && (
              <>
                <div className="journal-viewer-image">
                  <FanPhoto
                    key={activePhoto.id}
                    photo={activePhoto}
                    fullSize
                    priority
                    sizes="(max-width: 900px) 95vw, 850px"
                  />
                </div>
                <div className="journal-viewer-caption">
                  <p>{activePhoto.context}</p>
                  <a
                    className="journal-photo-credit"
                    href={activePhoto.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Photo © {photographer.name} · Original post ↗︎
                  </a>
                </div>
                <p className="journal-viewer-permission">
                  Shared with {photographer.name}'s permission. Full photo shown
                  with the original watermark.
                </p>
                <div className="journal-viewer-controls">
                  <button
                    type="button"
                    aria-label="Previous photo"
                    disabled={visiblePhotos.length < 2}
                    onClick={() => movePhoto(-1)}
                  >
                    <span aria-hidden="true">←</span> Previous
                  </button>
                  <span role="status" aria-live="polite" aria-atomic="true">
                    {activeIndex + 1} / {visiblePhotos.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next photo"
                    disabled={visiblePhotos.length < 2}
                    onClick={() => movePhoto(1)}
                  >
                    Next <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </section>
  );
}
