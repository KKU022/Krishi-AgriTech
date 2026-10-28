import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { FarmsPage } from './pages/FarmsPage.js';
import { CropRecommendationPage } from './pages/CropRecommendationPage.js';
import { ActivitiesPage } from './pages/ActivitiesPage.js';
import { SoilHealthPage } from './pages/SoilHealthPage.js';
import { DiseaseAnalysisPage } from './pages/DiseaseAnalysisPage.js';
import { AssistantPage } from './pages/AssistantPage.js';
import { WeatherPage } from './pages/WeatherPage.js';
import { ResourceCenterPage } from './pages/ResourceCenterPage.js';
import { MarketPricesPage } from './pages/MarketPricesPage.js';
import { MarketplacePage } from './pages/MarketplacePage.js';
import { ConsultationsPage } from './pages/ConsultationsPage.js';
import { CommunityPage } from './pages/CommunityPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminPage } from './pages/AdminPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-[#FDFBF7] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950 font-sans">
            <Routes>
              {/* Public Marketing Routes with Marketing Navbar & Footer */}
              <Route
                path="/"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <LandingPage />
                    </main>
                    <Footer />
                  </div>
                }
              />

              <Route
                path="/login"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <LoginPage />
                    </main>
                    <Footer />
                  </div>
                }
              />

              <Route
                path="/signup"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <SignupPage />
                    </main>
                    <Footer />
                  </div>
                }
              />

              {/* Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                      <Navbar />
                      <main className="flex-1 py-4">
                        <OnboardingPage />
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Authenticated SaaS Core Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/farms"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <FarmsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/crops"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CropRecommendationPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ActivitiesPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/soil-health"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SoilHealthPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/disease"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DiseaseAnalysisPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <WeatherPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AssistantPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/market"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MarketPricesPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MarketplacePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/consultations"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ConsultationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CommunityPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ResourceCenterPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Administrator Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AdminPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <NotFoundPage />
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
