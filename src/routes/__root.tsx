import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="font-display text-6xl font-extrabold text-white">404</h1>
        <p className="mt-3 text-[color:var(--ink-muted)]">Página não encontrada.</p>
        <a href="/clube" className="mt-6 inline-block rounded-lg bg-[color:var(--gain)] px-6 py-3 text-sm font-semibold text-[#062b14]">
          Ir para o clube
        </a>
      </div>
    </div>
  ),
});
