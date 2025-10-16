'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Dashboard } from './Dashboard';
import { ProductList } from './ProductList';
import { ProductDetail } from './ProductDetail';
import { ProductRegisterForm } from './ProductRegisterForm';
import { ProductEditForm } from './ProductEditForm';
import { StockMovement } from './StockMovement';
import { ProductNoteForm } from './ProductNoteForm';
import { Stocktaking } from './Stocktaking';
import { UserManagement } from './UserManagement';
import { MasterDataManagement } from './MasterDataManagement';
import { Reports } from './Reports';
import { QRCodeGenerator } from './QRCodeGenerator';
import { QRCodeScanner } from './QRCodeScanner';
import { Toaster } from './ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function App() {
  const { isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: string, productId?: string) => {
    setCurrentPage(page);
    setSelectedProductId(productId);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'products':
        return <ProductList onNavigate={handleNavigate} />;
      case 'product-detail':
        return <ProductDetail onNavigate={handleNavigate} productId={selectedProductId} />;
      case 'product-register':
        return <ProductRegisterForm onNavigate={handleNavigate} />;
      case 'product-edit':
        return <ProductEditForm onNavigate={handleNavigate} productId={selectedProductId} />;
      case 'stock-movement':
        return <StockMovement onNavigate={handleNavigate} />;
      case 'product-note-add':
        return <ProductNoteForm onNavigate={handleNavigate} productId={selectedProductId} />;
      case 'stocktaking':
        return <Stocktaking onNavigate={handleNavigate} />;
      case 'user-management':
        return <UserManagement onNavigate={handleNavigate} />;
      case 'master-data':
        return <MasterDataManagement onNavigate={handleNavigate} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} />;
      case 'qr-generator':
        return <QRCodeGenerator onNavigate={handleNavigate} productId={selectedProductId} />;
      case 'qr-scanner-stock-in':
        return <QRCodeScanner onNavigate={handleNavigate} mode="stock-in" />;
      case 'qr-scanner-stock-out':
        return <QRCodeScanner onNavigate={handleNavigate} mode="stock-out" />;
      case 'settings':
        return (
          <div className="space-y-4">
            <h1>設定</h1>
            <div className="p-8 text-center border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">設定機能は開発中です</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] overflow-x-hidden">
      <Header
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={handleNavigate}
      />
      
      <div className="flex overflow-x-hidden">
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileMenuOpen}
        />
        
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <main className="flex-1 w-full min-w-0 px-3 py-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto overflow-hidden">
            {renderPage()}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}
