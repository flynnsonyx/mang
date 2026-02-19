import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, Home, Compass, Bookmark } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/browse", icon: Compass, label: "Browse" },
    { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  ];

  return (
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
          <span className="text-xl font-display font-bold gradient-text">
            Yuvience
          </span>
        </Link>

        <div className="flex items-center gap-1">
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
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border/30"
        >
          <div className="container mx-auto px-4 py-3">
            <input
              autoFocus
              type="text"
              placeholder="Search manga..."
              className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
