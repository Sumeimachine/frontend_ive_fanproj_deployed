import { motion } from "framer-motion";
import FanPhoto from "../components/FanPhoto";
import PhotoJournal from "../components/PhotoJournal";
import { heroPhoto, photographer } from "../content/grantsor";
import { usePerformancePreferences } from "../hooks/usePerformancePreferences";

export default function PhotoGallery() {
  const { prefersReducedMotion } = usePerformancePreferences();
  const reveal = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="photo-gallery-page">
      <div className="photo-gallery-inner">
        <motion.header className="photo-gallery-heading" {...reveal}>
          <div>
            <p className="photo-gallery-eyebrow">
              The DIVE archive / Photography
            </p>
            <h1>
              Through a<br />
              <span>DIVE’s lens.</span>
            </h1>
          </div>
          <div className="photo-gallery-intro">
            <p>
              The little moments that stay with us. IVE in Manila, as seen by{" "}
              <a
                href={photographer.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{photographer.name} ↗
              </a>
              .
            </p>
            <a className="photo-gallery-browse" href="#photo-journal">
              Explore the photographs <span aria-hidden="true">↓</span>
            </a>
          </div>
        </motion.header>

        <motion.figure
          className="photo-gallery-feature"
          {...reveal}
          transition={{
            ...reveal.transition,
            delay: prefersReducedMotion ? 0 : 0.1,
          }}
        >
          <div className="photo-gallery-feature-image">
            <FanPhoto
              photo={heroPhoto}
              priority
              sizes="(max-width: 760px) 94vw, (max-width: 1200px) 70vw, 1040px"
            />
          </div>
          <figcaption>
            <p className="photo-gallery-feature-index">
              Featured photograph / 01
            </p>
            <div>
              <h2>{heroPhoto.title}</h2>
              <p className="photo-gallery-feature-context">
                IVE Switch Manila fansign
                <br />
                <time dateTime="2024-07-12">July 12, 2024</time>
              </p>
              <a
                className="photo-gallery-feature-credit"
                href={heroPhoto.postUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Photo © {photographer.name}
                <span>View original post ↗</span>
              </a>
            </div>
            <p className="photo-gallery-feature-note">
              Shared with permission.
              <br />A non-commercial fan project.
            </p>
          </figcaption>
        </motion.figure>

        <PhotoJournal />
      </div>
    </div>
  );
}
