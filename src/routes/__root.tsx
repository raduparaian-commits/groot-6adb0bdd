import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function PlantLogo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[70%] w-[70%]" aria-hidden>
        <ellipse className="plant-ground" cx="16" cy="27" rx="7" ry="1.6" fill="currentColor" opacity="0.5" />
        <g className="plant-stem">
          <path d="M16 27 C16 21 16 17 16 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path className="plant-leaf" d="M16 18 C11 18 8 15 7 10 C12 10 15 13 16 18 Z" fill="currentColor" />
          <path className="plant-leaf plant-leaf-r" d="M16 15 C21 15 24 12 25 7 C20 7 17 10 16 15 Z" fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <PlantLogo size={36} />
          <span className="font-display text-xl font-medium tracking-tight">Groot</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Home</Link>
          <Button asChild size="lg">
            <Link to="/prepare">Prepare for an Interview</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface text-surface-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <PlantLogo size={32} />
          <span className="font-display text-lg font-medium">Groot</span>
        </div>
        <p className="text-sm text-surface-foreground/70">
          Practice. Grow. Get Ready.
        </p>
        <nav className="flex gap-4 text-sm">
          <Link to="/" className="text-surface-foreground/80 hover:text-surface-foreground">
            Home
          </Link>
          <Link to="/prepare" className="text-surface-foreground/80 hover:text-surface-foreground">
            Prepare
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Groot — Practice. Grow. Get Ready." },
      { name: "description", content: "Mock interviews and mock applications that adapt to every university and job." },
      { property: "og:title", content: "Groot — Practice. Grow. Get Ready." },
      { property: "og:description", content: "Mock interviews and mock applications that adapt to every university and job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main className="flex flex-1 flex-col">
          <Outlet />
          <Toaster />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
