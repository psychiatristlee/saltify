import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGameViewModel } from './hooks/useGameViewModel';
import { useCouponManager } from './hooks/useCouponManager';
import { useReferral } from './hooks/useReferral';
import { useLanguage } from './contexts/LanguageContext';
import { getReferrerFromUrl } from './services/referral';
import { isEmbeddedApp } from './lib/platform';
import { isUserAdmin } from './services/admin';
import { createPendingOrder, OrderItem } from './services/order';
import { requestTossPayment } from './services/order/toss';
import PaymentResultView from './components/PaymentResultView';
import {
  trackScreenView,
  trackLandingStart,
  trackReferralComplete,
} from './services/analytics';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import AdminPage from './components/AdminPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AccountDeletion from './components/AccountDeletion';
import BottomTabBar, { Tab } from './components/BottomTabBar';
import MenuHome from './components/MenuHome';
import OrdersPage from './components/OrdersPage';
import GamePage from './components/GamePage';
import ProfilePage from './components/ProfilePage';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/account-deletion" element={<AccountDeletion />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp() {
  const { user, isLoading, isAuthenticated, signOut, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const couponManager = useCouponManager(user?.id || null);
  const game = useGameViewModel(couponManager.addCrushedBread);
  const referral = useReferral(user?.id || null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [savedPointsAmount, setSavedPointsAmount] = useState(0);
  const [showLanding, setShowLanding] = useState(() => {
    if (isEmbeddedApp()) return false;
    if (getReferrerFromUrl()) return false;
    return !localStorage.getItem('saltify_visited');
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [paymentResult, setPaymentResult] = useState<
    { orderId: string; paymentKey: string; amount: number } | null
  >(null);
  const referralProcessed = useRef(false);

  const handleStartOrdering = () => {
    trackLandingStart();
    localStorage.setItem('saltify_visited', 'true');
    setShowLanding(false);
    setActiveTab('home');
  };

  const confirmLogout = async () => {
    await signOut();
    if (!isEmbeddedApp()) setShowLanding(true);
  };

  useEffect(() => {
    if (
      user &&
      referral.hasPendingReferral &&
      referral.pendingReferrerId &&
      !referralProcessed.current &&
      !referral.isProcessing
    ) {
      referralProcessed.current = true;
      referral.processPendingReferral().then(async (result) => {
        if (result.success && referral.pendingReferrerId) {
          const couponSuccess = await couponManager.addReferralCoupons(
            referral.pendingReferrerId,
            user.id,
          );
          if (couponSuccess) {
            couponManager.showReferralCouponAlert();
            trackReferralComplete();
          }
        }
      });
    }
  }, [user, referral, couponManager]);

  useEffect(() => {
    if (user) {
      isUserAdmin(user.id).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    if (!status) return;
    if (status === 'success') {
      const orderId = params.get('orderId');
      const paymentKey = params.get('paymentKey');
      const amount = parseInt(params.get('amount') || '0', 10);
      if (orderId && paymentKey && amount) {
        setPaymentResult({ orderId, paymentKey, amount });
      }
    } else if (status === 'fail') {
      const message = params.get('message') || '결제가 취소되었거나 실패했습니다.';
      alert(message);
    }
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', clean);
  }, []);

  const handleStartOrderCheckout = async (items: OrderItem[]) => {
    if (!user) return;
    try {
      const orderId = await createPendingOrder({
        userId: user.id,
        userName: user.displayName || undefined,
        userEmail: user.email || undefined,
        items,
      });
      const total = items.reduce((s, it) => s + it.price * it.qty, 0);
      const orderName = items.length === 1
        ? items[0].name
        : `${items[0].name} 외 ${items.reduce((c, it) => c + it.qty, 0) - items[0].qty}개`;

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://game.salt-bbang.com';
      await requestTossPayment({
        orderId,
        orderName,
        amount: total,
        customerEmail: user.email || undefined,
        customerName: user.displayName || undefined,
        successUrl: `${origin}?payment=success`,
        failUrl: `${origin}?payment=fail`,
      });
    } catch (err) {
      console.error('payment failed', err);
      alert('결제 시작 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (showLanding) {
      trackScreenView('landing');
    } else if (!isAuthenticated) {
      trackScreenView('login');
    } else {
      trackScreenView(activeTab);
    }
  }, [isLoading, showLanding, isAuthenticated, activeTab]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <img
          src="/breads/plain.png"
          alt={t('loading')}
          className={styles.loadingIcon}
        />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onStartGame={handleStartOrdering} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onBackToLanding={() => {
          if (!isEmbeddedApp()) setShowLanding(true);
        }}
      />
    );
  }

  return (
    <div className={styles.appShell}>
      <main className={styles.tabContent}>
        {activeTab === 'home' && (
          <MenuHome
            onCheckout={async (items) => {
              await handleStartOrderCheckout(items);
            }}
          />
        )}
        {activeTab === 'orders' && user && <OrdersPage userId={user.id} />}
        {activeTab === 'game' && user && (
          <GamePage
            user={user}
            game={game}
            couponManager={couponManager}
            referral={referral}
            onSavedPoints={(earned) => {
              setSavedPointsAmount(earned);
              setShowSaveToast(true);
              setTimeout(() => setShowSaveToast(false), 2500);
            }}
          />
        )}
        {activeTab === 'profile' && user && (
          <ProfilePage
            userName={user.displayName || ''}
            email={user.email}
            photoURL={user.photoURL || null}
            isAdmin={isAdmin}
            totalPoints={couponManager.totalPoints}
            couponCount={couponManager.availableCoupons.length}
            onLogout={confirmLogout}
            onDeleteAccount={async () => {
              await deleteAccount();
              if (!isEmbeddedApp()) setShowLanding(true);
            }}
          />
        )}
      </main>

      <BottomTabBar
        active={activeTab}
        onChange={setActiveTab}
        couponCount={couponManager.availableCoupons.length}
      />

      {paymentResult && (
        <PaymentResultView
          orderId={paymentResult.orderId}
          paymentKey={paymentResult.paymentKey}
          amount={paymentResult.amount}
          onDone={() => {
            setPaymentResult(null);
            setActiveTab('orders');
          }}
        />
      )}

      {showSaveToast && (
        <div className={styles.saveToastOverlay}>
          <div className={styles.saveToastPaper}>
            <div className={styles.saveToastIcon}>&#128221;</div>
            <div className={styles.saveToastText}>{t('pointsSaved')}</div>
            {savedPointsAmount > 0 && (
              <div className={styles.saveToastPoints}>{savedPointsAmount.toLocaleString()}P</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
