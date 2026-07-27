import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Home, Compass, Bookmark, History, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import SearchDialog from "@/components/SearchDialog";
import AuthButton from "@/components/AuthButton";


const Navbar = () => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/browse", icon: Compass, label: "Browse" },
    { to: "/history", icon: History, label: "History" },
    { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <BookOpen className="w-7 h-7 text-primary transition-all duration-300 group-hover:text-accent" />
              <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-accent/30 transition-all duration-300" />
            </div>
            <span className="text-xl font-display font-bold gradient-text">Yuvience</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 gradient-primary rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setSearchOpen(true)}
              className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <AuthButton className="ml-2" />
          </div>


          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 80) setDrawerOpen(false);
              }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 glass border-l border-border/30 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-border/30">
                <span className="text-lg font-display font-bold gradient-text">Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {links.map(({ to, icon: Icon, label }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "gradient-primary text-primary-foreground glow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border/30 space-y-3">
                <AuthButton className="w-full justify-center" />
                <p className="text-xs text-muted-foreground">Swipe right to close</p>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
