import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { CameraPage } from './pages/CameraPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstagramPage } from './pages/InstagramPage';
import { InstagramCallbackPage } from './pages/InstagramCallbackPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/instagram/callback',
    element: <InstagramCallbackPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <CameraPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/instagram', element: <InstagramPage /> },
    ],
  },
]);

/** アプリケーションルーター */
export function Router() {
  return <RouterProvider router={router} />;
}
