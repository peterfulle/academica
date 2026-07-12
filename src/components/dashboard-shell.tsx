import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NAV_BY_ROL, ROL_LABEL, type Rol } from "@/lib/nav";

export function DashboardShell({
  rol,
  children,
}: {
  rol: Rol;
  children: React.ReactNode;
}) {
  const items = NAV_BY_ROL[rol];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r bg-muted/30 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold tracking-tight">Academica</p>
          <p className="text-sm text-muted-foreground">{ROL_LABEL[rol]}</p>
        </div>
        <Separator className="mb-4" />
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                {item.fase > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Fase {item.fase}
                  </Badge>
                )}
              </>
            );
            const className = "flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground/80";

            return item.href ? (
              <Link key={item.label} href={item.href} className={`${className} hover:bg-muted`}>
                {content}
              </Link>
            ) : (
              <div key={item.label} className={className}>
                {content}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
