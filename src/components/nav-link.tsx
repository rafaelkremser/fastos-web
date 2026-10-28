import { Link, type LinkProps, useLocation } from 'react-router'

export type NavLinkProps = LinkProps

export function NavLink(props: NavLinkProps) {
  const { pathname } = useLocation()

  // "/customers" stays highlighted on "/customers/:id"; "/" only on itself
  const isCurrent =
    pathname === props.to ||
    (props.to !== '/' && pathname.startsWith(`${props.to}/`))

  return (
    <Link
      data-current={isCurrent}
      className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 data-[current=true]:text-foreground"
      {...props}
    />
  )
}
