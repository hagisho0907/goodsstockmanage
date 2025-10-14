import { useState } from 'react';
import { ArrowLeft, Save, Upload, X, FileText, AlertCircle, Repeat, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { products } from '../lib/mockData';

interface ProductNoteFormProps {
  productId?: string;
  onNavigate: (page: string, productId?: string) => void;
}

export function ProductNoteForm({ productId, onNavigate }: ProductNoteFormProps) {
  const [noteType, setNoteType] = useState<string>('general');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const product = products.find(p => p.id === productId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    onNavigate('product-detail', productId);
  };

  const noteTypes = [
    { value: 'general', label: '一般メモ', icon: FileText, color: 'bg-blue-500' },
    { value: 'damage', label: '破損報告', icon: AlertCircle, color: 'bg-red-500' },
    { value: 'handover', label: '引き継ぎ', icon: Repeat, color: 'bg-orange-500' },
    { value: 'quality', label: '品質確認', icon: Package, color: 'bg-green-500' },
  ];

  const selectedNoteType = noteTypes.find(t => t.value === noteType);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => onNavigate('product-detail', productId)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            物品詳細に戻る
          </Button>
          <h1 className="mt-4">申し送り追加</h1>
        </div>
      </div>

      {/* Product Info */}
      {product && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3>{product.name}</h3>
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{product.categoryName}</Badge>
                  <Badge variant="secondary">在庫: {product.currentStock}個</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>申し送り内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Note Type */}
            <div className="space-y-2">
              <Label htmlFor="noteType">
                申し送りタイプ <span className="text-[#EF4444]">*</span>
              </Label>
              <Select value={noteType} onValueChange={setNoteType} required>
                <SelectTrigger id="noteType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedNoteType && (
                <p className="text-xs text-muted-foreground">
                  {selectedNoteType.value === 'general' && '一般的なメモや連絡事項'}
                  {selectedNoteType.value === 'damage' && '商品の破損や不良に関する報告'}
                  {selectedNoteType.value === 'handover' && '担当者間の引き継ぎ事項'}
                  {selectedNoteType.value === 'quality' && '品質確認や検品に関する記録'}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">
                内容 <span className="text-[#EF4444]">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="申し送りの内容を入力してください"
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                できるだけ具体的に記載してください（日時、数量、状況など）
              </p>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>添付ファイル</Label>
              <div className="space-y-3">
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">
                    画像やファイルを追加
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  画像（JPG、PNG）またはドキュメント（PDF、Word）をアップロードできます
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!content.trim()}
            className="bg-[#2563EB] hover:bg-[#1d4ed8]"
          >
            <Save className="h-4 w-4 mr-2" />
            登録
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('product-detail', productId)}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
