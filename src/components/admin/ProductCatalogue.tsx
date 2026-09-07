import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, AlertCircle, Edit3, Trash2 } from 'lucide-react';

interface ProductCatalogueProps {
  products: any[];
  isLoading: boolean;
  error: any;
  restockCounts: Record<string, number>;
  isDeletingProduct: string | null;
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductCatalogue: React.FC<ProductCatalogueProps> = ({
  products,
  isLoading,
  error,
  restockCounts,
  isDeletingProduct,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-[#1E3A66]">
          Product Catalogue
        </h1>
        <Button onClick={onAddProduct} className="gap-2" size="sm">
          <Plus className="w-4 h-4" /> Add SKU
        </Button>
      </div>

      <Card className="bg-card border-slate-200 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-blue-200">Product & SKU</TableHead>
              <TableHead className="text-blue-200">Category</TableHead>
              <TableHead className="text-blue-200">Pricing (INR)</TableHead>
              <TableHead className="text-blue-200 text-center">Stock</TableHead>
              <TableHead className="text-blue-200">Status</TableHead>
              <TableHead className="text-blue-200 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <AlertCircle className="w-10 h-10 mx-auto text-destructive/50 mb-3" />
                  <p className="text-sm font-bold text-destructive">Permission Denied</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check Firestore security rules or authentication status.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products?.map((prod) => (
                <TableRow
                  key={prod.id}
                  className="border-b border-slate-100 group hover:bg-slate-50/50"
                >
                  <TableCell>
                    <div className="font-bold text-slate-900 mb-0.5">{prod.name}</div>
                    <div className="text-[10px] font-mono text-blue-200 uppercase tracking-widest">
                      {prod.sku}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-200 uppercase tracking-widest text-[#1E3A66]"
                    >
                      {prod.categoryId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-bold text-slate-900">₹{prod.salePrice}</div>
                    <div className="text-[10px] text-blue-100 line-through opacity-60">
                      ₹{prod.basePrice}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-bold ${prod.inventory <= 0 ? 'text-red-600' : prod.inventory < 20 ? 'text-orange-600' : 'text-slate-600'}`}
                      >
                        {prod.inventory <= 0 ? 'OUT OF STOCK' : prod.inventory}
                      </span>
                      {restockCounts[prod.id] > 0 && (
                        <Badge className="bg-blue-500 text-white border-none text-[8px] px-1 py-0 animate-pulse">
                          {restockCounts[prod.id]} REQUESTS
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        prod.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }
                    >
                      {prod.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 hover:text-primary transition-colors"
                        onClick={() => onEditProduct(prod)}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 hover:text-destructive transition-colors"
                        onClick={() => onDeleteProduct(prod.id)}
                        disabled={!!isDeletingProduct}
                      >
                        {isDeletingProduct === prod.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
