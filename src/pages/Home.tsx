import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowDownIcon, ArrowForwardIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { motion, useScroll, useTransform } from "framer-motion";
import { getMemberProfiles, loadMemberProfiles } from "../services/memberProfileStore";
import ResponsiveMemberImage from "../components/ResponsiveMemberImage";
import FanPhoto from "../components/FanPhoto";
import { fanPhotos, heroPhoto, photographer } from "../content/grantsor";
import { usePerformancePreferences } from "../hooks/usePerformancePreferences";
import "./Home.css";

const MemberUniverseSection = lazy(() => import("../components/MemberUniverseSection"));

const experiences = [
  { title: "Music, in numbers.", detail: "Explore IVE’s YouTube momentum.", to: "/dashboard", action: "View the dashboard" },
  { title: "Make it a daily thing.", detail: "Put your IVE knowledge to the test.", to: "/quiz/daily", action: "Play the daily quiz" },
  { title: "Find your fellow DIVEs.", detail: "Discover community fan events.", to: "/fan-events", action: "Explore fan events" },
  { title: "Your next favorite card.", detail: "Step into the IVE card game.", to: "/card-game", action: "Play the card game" },
];

export default function Home() {
  const navigate = useNavigate();
  const { hash, key } = useLocation();
  const heroRef = useRef<HTMLElement>(null);
  const [members, setMembers] = useState(loadMemberProfiles);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const { prefersReducedMotion, prefersReducedData } = usePerformancePreferences();
  const motionEnabled = !prefersReducedMotion && !prefersReducedData && !motionPaused;
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const photographY = useTransform(scrollYProgress, [0, 1], [0, 55]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  useEffect(() => {
    let active = true;
    void getMemberProfiles().then((profiles) => { if (active) setMembers(profiles); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hash !== "#members") return;
    const frame = requestAnimationFrame(() => document.getElementById("members")?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);

  return (
    <div className={`cinema-home ${motionEnabled ? "cinema-motion" : "cinema-still"}`}>
      <section className="cinema-hero" ref={heroRef} aria-labelledby="cinema-title">
        <div className="cinema-beams" aria-hidden="true"><i /><i /></div>
        <div className="cinema-hero-topline">
          <span>A home for Philippine DIVEs</span>
          <button
            type="button"
            className="cinema-motion-toggle"
            aria-pressed={!motionEnabled}
            disabled={prefersReducedMotion || prefersReducedData}
            onClick={() => setMotionPaused((paused) => !paused)}
          >
            <span className="cinema-motion-bars" aria-hidden="true"><i /><i /><i /></span>
            {prefersReducedMotion || prefersReducedData ? "Reduced motion" : motionPaused ? "Resume motion" : "Pause motion"}
          </button>
        </div>

        <div className="cinema-hero-grid">
          <motion.div className="cinema-hero-copy" style={{ y: motionEnabled ? titleY : 0 }}>
            <h1 id="cinema-title">ALL IN.<br /><span>ALL IVE.</span></h1>
            <p>For the songs on repeat.<br />The moments we keep.<br />And the six who bring us together.</p>
            <div className="cinema-hero-actions">
              <Link className="cinema-button" to="/#members">Meet IVE <ArrowDownIcon aria-hidden="true" /></Link>
              <Link className="cinema-text-link" to="/photo-gallery">Explore the gallery <ArrowForwardIcon aria-hidden="true" /></Link>
            </div>
          </motion.div>

          <motion.figure className="cinema-hero-photograph" style={{ y: motionEnabled ? photographY : 0 }}>
            <div className="cinema-photo-frame">
              <FanPhoto photo={heroPhoto} priority sizes="(max-width: 800px) 100vw, 62vw" />
            </div>
            <figcaption className="cinema-photo-caption">
              <div><strong>Yujin &amp; Gaeul</strong><span>IVE Switch Manila Fansign · July 12, 2024</span></div>
              <a href={heroPhoto.postUrl} target="_blank" rel="noopener noreferrer">Photo © GrantSor · Original post <ExternalLinkIcon aria-hidden="true" /></a>
              <span className="cinema-permission">Used with permission</span>
            </figcaption>
          </motion.figure>
        </div>
        <div className="cinema-hero-bottom">
          <span>Music. Moments. Community.</span>
          <a href="#members">Keep diving <ArrowDownIcon aria-hidden="true" /></a>
        </div>
      </section>

      <section className="cinema-members cinema-section" id="members" aria-labelledby="members-title">
        <div className="cinema-section-heading">
          <h2 id="members-title">SIX STARS.<br /><span>ONE IVE.</span></h2>
          <p>Get to know the members.<br />Find the details behind your favorite moments.</p>
        </div>
        <div className="cinema-member-grid">
          {members.map((member, index) => (
            <motion.article
              className="cinema-member"
              key={member.id}
              initial={false}
              whileInView={motionEnabled ? { y: [18, 0] } : undefined}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/member/${member.id}`} aria-label={`Explore ${member.name}'s profile`}>
                <div className="cinema-member-image">
                  <ResponsiveMemberImage
                    src={member.photoUrl || member.backupPhotoUrl}
                    alt={member.name}
                    sizes="(max-width: 600px) 45vw, (max-width: 1000px) 29vw, 16vw"
                    style={{ objectPosition: `${member.photoObjectPositionX ?? 50}% ${member.photoObjectPositionY ?? 50}%` }}
                  />
                </div>
                <div className="cinema-member-name"><h3>{member.name}</h3><ArrowForwardIcon aria-hidden="true" /></div>
                <p>{member.tagline}</p>
              </Link>
            </motion.article>
          ))}
        </div>
        <div className="cinema-orbit-bar">
          <p>A different way to meet the members.</p>
          <button type="button" className="cinema-text-link" aria-expanded={orbitOpen} aria-controls="member-orbit" onClick={() => setOrbitOpen((open) => !open)}>
            {orbitOpen ? "Close the 3D universe" : "Enter the 3D universe"} <ArrowForwardIcon aria-hidden="true" />
          </button>
        </div>
        <div id="member-orbit">
          {orbitOpen && (
            <Suspense fallback={<div className="cinema-orbit-loading" role="status">Opening the IVE universe…</div>}>
              <MemberUniverseSection members={members} onSelectMember={(id) => navigate(`/member/${id}`)} motionPaused={!motionEnabled} />
            </Suspense>
          )}
        </div>
      </section>

      <section className="cinema-moments cinema-section" aria-labelledby="moments-title">
        <div className="cinema-moments-copy">
          <h2 id="moments-title">CLOSE TO<br /><span>THE MOMENT.</span></h2>
          <p>Small gestures. Familiar faces. Memories from Manila, captured by a fellow DIVE.</p>
          <p className="cinema-contributor">Through the lens of <a href={photographer.profileUrl} target="_blank" rel="noopener noreferrer">@GrantSor <ExternalLinkIcon aria-hidden="true" /></a></p>
          <Link to="/photo-gallery" className="cinema-button">Open the photo gallery <ArrowForwardIcon aria-hidden="true" /></Link>
        </div>
        <div className="cinema-moments-photos">
          {[fanPhotos[3], fanPhotos[2]].map((photo) => (
            <figure key={photo.id}>
              <Link to="/photo-gallery" aria-label={`Explore the gallery featuring ${photo.members.join(" and ")}`}>
                <FanPhoto photo={photo} sizes="(max-width: 600px) 45vw, 25vw" />
              </Link>
              <figcaption>
                <span>{photo.members.join(" & ")}</span>
                <a href={photo.postUrl} target="_blank" rel="noopener noreferrer">© GrantSor · Original post <ExternalLinkIcon aria-hidden="true" /></a>
                <span>Used with permission</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="cinema-community cinema-section" aria-labelledby="community-title">
        <div className="cinema-section-heading">
          <h2 id="community-title">STAY IN<br /><span>IVE’S WORLD.</span></h2>
          <p>A little closer, every day.<br />Explore more of your fan community.</p>
        </div>
        <div className="cinema-experience-list">
          {experiences.map((experience) => (
            <Link key={experience.to} to={experience.to} className="cinema-experience">
              <h3>{experience.title}</h3>
              <p>{experience.detail}</p>
              <span>{experience.action} <ArrowForwardIcon aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
        <div className="cinema-closing"><span>Always IVE.<br />Always DIVE.</span><Link to="/about">About this fan project <ArrowForwardIcon aria-hidden="true" /></Link></div>
      </section>
    </div>
  );
}
