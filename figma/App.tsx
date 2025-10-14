import { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ProductDetail } from './components/ProductDetail';
import { ProductRegisterForm } from './components/ProductRegisterForm';
import { ProductEditForm } from './components/ProductEditForm';
import { StockMovement } from './components/StockMovement';
import { ProductNoteForm } from './components/ProductNoteForm';
import { Toaster } from './components/ui/sonner';

export default function App() {
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
        return (
          <div className="space-y-4">
            <h1>棚卸し</h1>
            <div className="p-8 text-center border rounded-lg bg-gray-50">
              <p className="text-muted-foreground">棚卸し機能は開発中です</p>
            </div>
          </div>
        );
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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={handleNavigate}
      />
      
      <div className="flex">
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
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}