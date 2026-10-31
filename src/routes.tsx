import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { NotFound } from './pages/404'
import { FindStore } from './pages/auth/find-store'
import { SignIn } from './pages/auth/sign-in'
import { SignUp } from './pages/auth/sign-up'
import { ErrorPage } from './pages/error'
import { AppLayout } from './pages/layouts/app'
import { AuthLayout } from './pages/layouts/auth'

// The public site, on the app host itself
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/sign-up" replace /> },
      { path: 'sign-up', element: <SignUp /> },
      { path: 'sign-in', element: <FindStore /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]

// A store, on its own subdomain. The panel's pages load when first opened, so
// the sign-in page does not download them
const tenantRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    // Nothing while the first page's code loads. A null element would not
    // count, and React Router would warn on every page
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        lazy: () =>
          import('./pages/app/dashboard/dashboard').then((module) => ({
            Component: module.Dashboard,
          })),
      },
      {
        path: 'service-orders',
        lazy: () =>
          import('./pages/app/service-orders/service-orders').then(
            (module) => ({ Component: module.ServiceOrders }),
          ),
      },
      {
        path: 'service-orders/new',
        lazy: () =>
          import('./pages/app/service-orders/new-service-order').then(
            (module) => ({ Component: module.NewServiceOrder }),
          ),
      },
      {
        path: 'service-orders/:serviceOrderId',
        lazy: () =>
          import('./pages/app/service-orders/service-order-details').then(
            (module) => ({ Component: module.ServiceOrderDetails }),
          ),
      },
      {
        path: 'customers',
        lazy: () =>
          import('./pages/app/customers/customers').then((module) => ({
            Component: module.Customers,
          })),
      },
      {
        path: 'customers/:customerId',
        lazy: () =>
          import('./pages/app/customers/customer-details').then((module) => ({
            Component: module.CustomerDetails,
          })),
      },
      {
        path: 'team',
        lazy: () =>
          import('./pages/app/team/team').then((module) => ({
            Component: module.Team,
          })),
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [{ path: 'sign-in', element: <SignIn /> }],
  },
  { path: '*', element: <NotFound /> },
]

export function createRouter(tenantSlug: string | null) {
  return createBrowserRouter(tenantSlug ? tenantRoutes : publicRoutes)
}
