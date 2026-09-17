import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { eventApi } from "../services/api/eventApi";
import type { EventReward } from "../types/api";
import "./MainLayout.css";

function ChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function ArrowUpRight() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const mobileMenu = useDisclosure();
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const {
    logout,
    isAuthenticated,
    username,
    role,
    currencyBalance,
    dailyRewardClaimedToday,
    bootstrapProfile,
  } = useAuth();
  const [activeEventReward, setActiveEventReward] = useState<EventReward | null>(null);
  const [claimingEventReward, setClaimingEventReward] = useState(false);

  const exploreItems = [
    { label: "About us", to: "/about" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Quiz leaderboards", to: "/quiz/leaderboards" },
    { label: "Fan events", to: "/fan-events" },
    { label: "Fan pages", to: "/pages" },
    ...(isAuthenticated
      ? [
          { label: "Daily quiz", to: "/quiz/daily" },
          { label: "Card game", to: "/card-game" },
        ]
      : []),
  ];
  const adminItems = [
    ...((role === "Admin" || role === "Super-Admin")
      ? [
          { label: "Content editor", to: "/pages/editor" },
          { label: "Quiz manager", to: "/admin/quizzes" },
          { label: "Media library", to: "/admin/media" },
        ]
      : []),
    ...(role === "Super-Admin"
      ? [
          { label: "Account ops", to: "/super-admin/users" },
          { label: "Point rewards", to: "/super-admin/events" },
          { label: "Fan event ops", to: "/super-admin/fan-events" },
        ]
      : []),
  ];
  const membersActive = location.pathname === "/" && location.hash === "#members";
  const homeActive = location.pathname === "/" && !membersActive;
  const exploreActive = [...exploreItems, ...adminItems].some((item) => item.to === location.pathname);

  useEffect(() => {
    if (!location.hash && navigationType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname, location.hash, location.key, navigationType]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveEventReward(null);
      return;
    }

    void (async () => {
      try {
        const activeEvent = await eventApi.getActiveEventReward();
        setActiveEventReward("id" in activeEvent ? activeEvent : null);
      } catch {
        setActiveEventReward(null);
      }
    })();
  }, [isAuthenticated]);

  const claimEventReward = async () => {
    if (!activeEventReward) return;

    try {
      setClaimingEventReward(true);
      await eventApi.claimEventReward(activeEventReward.id);
      setActiveEventReward(null);
      await bootstrapProfile();
    } finally {
      setClaimingEventReward(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    mobileMenu.onClose();
    navigate("/login");
  };

  const visitMembers = () => {
    mobileMenu.onClose();
    if (location.pathname === "/") {
      document.getElementById("members")?.scrollIntoView({ block: "start" });
    }
  };

  const fanPoints = (
    <div className="ive-shell-points">
      <span className="ive-shell-eyebrow">IVE fan points</span>
      <strong>{currencyBalance} <span>points</span></strong>
      <span className="ive-shell-reward-state" data-claimed={dailyRewardClaimedToday}>
        <span aria-hidden="true" />
        {dailyRewardClaimedToday ? "Daily +1 claimed" : "Daily +1 ready"}
      </span>
      <p>Log in once each day to claim +1 fan point.</p>
    </div>
  );

  return (
    <div className="ive-shell dark-shell">
      <a className="ive-shell-skip" href="#main-content">Skip to content</a>
      <header className="ive-shell-header">
        <div className="ive-shell-header-inner">
          <Link className="ive-shell-brand" to="/" aria-label="DIVE INTO IVE home">
            <span className="ive-shell-monogram" aria-hidden="true">IVE<span>•</span></span>
            <span className="ive-shell-brand-caption">DIVE INTO IVE<span>A Philippine fan community</span></span>
          </Link>

          <nav className="ive-shell-desktop-nav" aria-label="Main navigation">
            <Link className={`ive-shell-nav-link${homeActive ? " is-active" : ""}`} to="/" aria-current={homeActive ? "page" : undefined}>Home</Link>
            <Link className={`ive-shell-nav-link${membersActive ? " is-active" : ""}`} to="/#members" aria-current={membersActive ? "location" : undefined} onClick={visitMembers}>Members</Link>
            <NavLink className="ive-shell-nav-link" to="/photo-gallery" end>Photo gallery</NavLink>
            <Menu placement="bottom-end" isLazy>
              <MenuButton className={`ive-shell-nav-link ive-shell-explore${exploreActive ? " is-active" : ""}`}>
                <span>Explore <ChevronDown /></span>
              </MenuButton>
              <MenuList className="ive-shell-menu" bg="#131217" borderColor="whiteAlpha.200" color="#f6f3f5" minW="240px" p={2}>
                <span className="ive-shell-menu-label">Your DIVE world</span>
                {exploreItems.map((item) => (
                  <MenuItem key={item.to} as={NavLink} to={item.to} end bg="transparent" _focus={{ bg: "whiteAlpha.100" }} className="ive-shell-menu-link">
                    {item.label}
                  </MenuItem>
                ))}
                {adminItems.length > 0 && <><MenuDivider borderColor="whiteAlpha.200" /><span className="ive-shell-menu-label">Manage</span></>}
                {adminItems.map((item) => (
                  <MenuItem key={item.to} as={NavLink} to={item.to} end bg="transparent" _focus={{ bg: "whiteAlpha.100" }} className="ive-shell-menu-link">
                    {item.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </nav>

          <div className="ive-shell-header-actions">
            <div className="ive-shell-desktop-account">
              {isAuthenticated ? (
                <Menu placement="bottom-end" isLazy>
                  <MenuButton className="ive-shell-account-button">
                    <span className="ive-shell-account-initial" aria-hidden="true">{(username || "D").slice(0, 1).toUpperCase()}</span>
                    <span className="ive-shell-account-name">{username || "My account"}</span>
                    <ChevronDown />
                  </MenuButton>
                  <MenuList className="ive-shell-menu" bg="#131217" borderColor="whiteAlpha.200" color="#f6f3f5" minW="260px" p={2}>
                    <div className="ive-shell-account-heading"><strong>{username || "DIVE"}</strong><span>{role || "Member"}</span></div>
                    {fanPoints}
                    <MenuDivider borderColor="whiteAlpha.200" />
                    <MenuItem onClick={() => void handleLogout()} bg="transparent" _focus={{ bg: "whiteAlpha.100" }}>Log out <span className="ive-shell-menu-arrow" aria-hidden="true">↗</span></MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Link className="ive-shell-join" to="/login">Join DIVE <ArrowUpRight /></Link>
              )}
            </div>
            <button type="button" className="ive-shell-mobile-toggle" ref={mobileMenuButton} onClick={mobileMenu.onOpen} aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={mobileMenu.isOpen}>
              <span /> <span />
            </button>
          </div>
        </div>
      </header>

      <main className="ive-shell-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="ive-shell-footer">
        <div className="ive-shell-footer-top">
          <Link className="ive-shell-footer-wordmark" to="/">DIVE INTO IVE<span aria-hidden="true">↗</span></Link>
          <p>For the music. For the moments.<br />For every DIVE.</p>
        </div>
        <div className="ive-shell-footer-bottom">
          <p>An independent, non-commercial fan project in the Philippines.<br />Not affiliated with IVE or Starship Entertainment.</p>
          <nav aria-label="Footer navigation">
            <Link to="/about">About us</Link>
            <Link to="/photo-gallery">Photo credits & gallery</Link>
            <Link to="/fan-events">Fan events</Link>
          </nav>
          <span className="ive-shell-footer-signoff">Made for DIVE <span aria-hidden="true">✦</span></span>
        </div>
      </footer>

      <Drawer isOpen={mobileMenu.isOpen} placement="right" onClose={mobileMenu.onClose} finalFocusRef={mobileMenuButton} size="sm">
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent className="ive-shell-drawer" bg="#101014" color="#f6f3f5">
          <DrawerCloseButton size="lg" top={5} right={5} aria-label="Close navigation menu" />
          <DrawerHeader className="ive-shell-drawer-heading" pt={7} pb={7}>DIVE INTO IVE</DrawerHeader>
          <DrawerBody px={7} pb={8}>
            <nav className="ive-shell-mobile-nav" aria-label="Mobile navigation">
              <Link to="/" className={homeActive ? "is-active" : undefined} aria-current={homeActive ? "page" : undefined} onClick={mobileMenu.onClose}>Home <span aria-hidden="true">01</span></Link>
              <Link to="/#members" className={membersActive ? "is-active" : undefined} aria-current={membersActive ? "location" : undefined} onClick={visitMembers}>Members <span aria-hidden="true">02</span></Link>
              <NavLink to="/photo-gallery" end onClick={mobileMenu.onClose}>Photo gallery <span aria-hidden="true">03</span></NavLink>
            </nav>
            <span className="ive-shell-mobile-label">Explore</span>
            <nav className="ive-shell-mobile-explore" aria-label="More pages">
              {exploreItems.map((item) => <NavLink to={item.to} key={item.to} end onClick={mobileMenu.onClose}>{item.label}</NavLink>)}
            </nav>
            {adminItems.length > 0 && <>
              <span className="ive-shell-mobile-label">Manage</span>
              <nav className="ive-shell-mobile-explore" aria-label="Management pages">
                {adminItems.map((item) => <NavLink to={item.to} key={item.to} end onClick={mobileMenu.onClose}>{item.label}</NavLink>)}
              </nav>
            </>}
            <div className="ive-shell-mobile-account">
              {isAuthenticated ? <>
                <div className="ive-shell-account-heading"><strong>{username || "DIVE"}</strong><span>{role || "Member"}</span></div>
                {fanPoints}
                <button className="ive-shell-mobile-logout" type="button" onClick={() => void handleLogout()}>Log out <ArrowUpRight /></button>
              </> : <Link to="/login" className="ive-shell-join" onClick={mobileMenu.onClose}>Join DIVE <ArrowUpRight /></Link>}
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={activeEventReward !== null} onClose={() => setActiveEventReward(null)} isCentered>
        <ModalOverlay />
        <ModalContent bg="#1A1630" color="white">
          <ModalHeader>{activeEventReward?.title ?? "Event Reward"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3} color="whiteAlpha.900">{activeEventReward?.message}</Text>
            <Text color="purple.200">Claim reward: +{activeEventReward?.points ?? 0} points</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setActiveEventReward(null)}>Later</Button>
            <Button colorScheme="purple" isLoading={claimingEventReward} onClick={() => void claimEventReward()}>Claim</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
