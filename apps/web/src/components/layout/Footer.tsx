import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-foreground text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4">Nepali News Hub</h3>
            <p className="text-sm text-gray-400">
              Your trusted source for the latest news from Nepal and around the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/categories/politics" className="text-gray-400 hover:text-white transition-colors">
                  Politics
                </Link>
              </li>
              <li>
                <Link href="/categories/business" className="text-gray-400 hover:text-white transition-colors">
                  Business
                </Link>
              </li>
              <li>
                <Link href="/categories/sports" className="text-gray-400 hover:text-white transition-colors">
                  Sports
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories/technology" className="text-gray-400 hover:text-white transition-colors">
                  Technology
                </Link>
              </li>
              <li>
                <Link href="/categories/entertainment" className="text-gray-400 hover:text-white transition-colors">
                  Entertainment
                </Link>
              </li>
              <li>
                <Link href="/categories/health" className="text-gray-400 hover:text-white transition-colors">
                  Health
                </Link>
              </li>
              <li>
                <Link href="/categories/education" className="text-gray-400 hover:text-white transition-colors">
                  Education
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Nepali News Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
