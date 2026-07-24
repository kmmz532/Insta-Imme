import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { CameraPage } from './pages/CameraPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstagramPage } from './pages/InstagramPage';
import { PresetsPage } from './pages/PresetsPage';
import { HistoryPage } from './pages/HistoryPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <CameraPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/instagram', element: <InstagramPage /> },
      { path: 'settings/presets', element: <PresetsPage /> },
    ],
  },
]);

/** アプリケーションルーター */
export function Router() {
  return <RouterProvider router={router} />;
}
