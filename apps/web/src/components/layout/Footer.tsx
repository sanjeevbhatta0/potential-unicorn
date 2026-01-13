import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Nepali News Hub</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted source for the latest news from Nepal and around the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/categories/politics" className="text-muted-foreground hover:text-primary">
                  Politics
                </Link>
              </li>
              <li>
                <Link href="/categories/business" className="text-muted-foreground hover:text-primary">
                  Business
                </Link>
              </li>
              <li>
                <Link href="/categories/sports" className="text-muted-foreground hover:text-primary">
                  Sports
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories/technology" className="text-muted-foreground hover:text-primary">
                  Technology
                </Link>
              </li>
              <li>
                <Link href="/categories/entertainment" className="text-muted-foreground hover:text-primary">
                  Entertainment
                </Link>
              </li>
              <li>
                <Link href="/categories/health" className="text-muted-foreground hover:text-primary">
                  Health
                </Link>
              </li>
              <li>
                <Link href="/categories/education" className="text-muted-foreground hover:text-primary">
                  Education
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Nepali News Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
