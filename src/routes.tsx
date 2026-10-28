import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { NotFound } from './pages/404'
import { CustomerDetails } from './pages/app/customers/customer-details'
import { Customers } from './pages/app/customers/customers'
import { Dashboard } from './pages/app/dashboard/dashboard'
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

// A store, on its own subdomain
const tenantRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:customerId', element: <CustomerDetails /> },
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
