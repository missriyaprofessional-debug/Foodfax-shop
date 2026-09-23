/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OwnerAppProvider, useOwnerApp } from './context/OwnerAppContext';
import { MobileFrame } from './components/MobileFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ShopSetupScreen } from './screens/ShopSetupScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { OrderDetailsModal } from './screens/OrderDetailsModal';
import { MenuScreen } from './screens/MenuScreen';
import { AddEditMenuItemModal } from './screens/AddEditMenuItemModal';
import { ShopQrScreen } from './screens/ShopQrScreen';
import { SalesScreen } from './screens/SalesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ShopSettingsModal } from './screens/ShopSettingsModal';
import { ShopProfileModal } from './screens/ShopProfileModal';
import { NotificationsModal } from './screens/NotificationsModal';
import { MenuItem } from './types';

const MainAppContent: React.FC = () => {
  const { activeScreen, isAuthenticated, hasCompletedShopSetup } = useOwnerApp();

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showShopProfileModal, setShowShopProfileModal] = useState<boolean>(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showAddMenuModal, setShowAddMenuModal] = useState<boolean>(false);

  // Authenticated internal screen check
  const isInternalApp =
    isAuthenticated &&
    hasCompletedShopSetup &&
    !['splash', 'onboarding', 'login', 'register', 'shop_setup'].includes(activeScreen);

  return (
    <MobileFrame isMobileFrame={false}>
      {/* Top App Bar on internal screens */}
      {isInternalApp && (
        <TopAppBar
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
        />
      )}

      {/* Screen Router */}
      <main className="flex-1 overflow-y-auto">
        {activeScreen === 'splash' && <SplashScreen />}
        {activeScreen === 'onboarding' && <OnboardingScreen />}
        {activeScreen === 'login' && <LoginScreen />}
        {activeScreen === 'register' && <RegisterScreen />}
        {activeScreen === 'shop_setup' && <ShopSetupScreen />}
        {activeScreen === 'dashboard' && <DashboardScreen />}
        {activeScreen === 'orders' && <OrdersScreen />}
        {activeScreen === 'menu' && (
          <MenuScreen
            onOpenAddItem={(item) => {
              setEditingMenuItem(item || null);
              setShowAddMenuModal(true);
            }}
          />
        )}
        {activeScreen === 'shop_qr' && <ShopQrScreen />}
        {activeScreen === 'sales' && <SalesScreen />}
        {activeScreen === 'profile' && (
          <ProfileScreen
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenShopProfile={() => setShowShopProfileModal(true)}
          />
        )}
      </main>

      {/* Bottom Nav Bar on internal screens */}
      {isInternalApp && <BottomNavBar />}

      {/* Order Details Modal */}
      <OrderDetailsModal />

      {/* Add / Edit Menu Item Modal */}
      {showAddMenuModal && (
        <AddEditMenuItemModal
          itemToEdit={editingMenuItem}
          onClose={() => {
            setShowAddMenuModal(false);
            setEditingMenuItem(null);
          }}
        />
      )}

      {/* Shop Operations Settings Modal */}
      {showSettingsModal && (
        <ShopSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Shop Profile Modal */}
      {showShopProfileModal && (
        <ShopProfileModal onClose={() => setShowShopProfileModal(false)} />
      )}

      {/* Live Store Notifications Modal */}
      {showNotificationsModal && (
        <NotificationsModal onClose={() => setShowNotificationsModal(false)} />
      )}
    </MobileFrame>
  );
};

export default function App() {
  return (
    <OwnerAppProvider>
      <MainAppContent />
    </OwnerAppProvider>
  );
}
