'use client';

import React, { useMemo } from 'react';
import { AlertCircle, Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { Chip, PageHeader, Panel, StatRow, TableMessage, Td, Th, THead, inr } from './admin-ui';

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
  const stats = useMemo(() => {
    const list = products || [];
    return {
      units: list.reduce((sum, p) => sum + Math.max(0, Number(p.inventory) || 0), 0),
      out: list.filter((p) => Number(p.inventory) <= 0).length,
      categories: new Set(list.map((p) => p.categoryId).filter(Boolean)).size,
    };
  }, [products]);

  return (
    <div>
      <PageHeader
        tag={`${products?.length || 0} SKUs`}
        before="Shop"
        accent="Catalogue"
        description="Standard components listed in the MechHub shop."
        action={
          <button type="button" onClick={onAddProduct} className="adm-btn adm-btn-primary h-11">
            <Plus className="size-3.5" /> Add product
          </button>
        }
      />

      <StatRow
        stats={[
          { label: 'SKUs', value: products?.length || 0 },
          { label: 'Units in stock', value: stats.units },
          { label: 'Out of stock', value: stats.out },
          { label: 'Categories', value: stats.categories },
        ]}
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <THead>
            <Th>SKU</Th>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th className="text-right">
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={7} loading>
                Loading products
              </TableMessage>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="size-6 text-[oklch(58%_0.22_27)]" />
                    <p className="text-sm text-[oklch(58%_0.22_27)]">Permission denied</p>
                    <p className="text-xs text-lp-muted-fg">Check Firestore security rules or authentication status.</p>
                  </div>
                </td>
              </tr>
            ) : !products?.length ? (
              <TableMessage colSpan={7}>No products in catalogue</TableMessage>
            ) : (
              products.map((prod) => {
                const stock = Number(prod.inventory) || 0;
                return (
                  <tr key={prod.id} className="adm-row group border-b border-lp-border last:border-b-0">
                    <Td className="font-lp-mono text-xs text-lp-primary">{prod.sku}</Td>
                    <Td>
                      <span className="adm-row-title text-sm">{prod.name}</span>
                    </Td>
                    <Td>
                      <Chip tone="ink">{prod.categoryId}</Chip>
                    </Td>
                    <Td>
                      <p className="text-sm tabular-nums">{inr(prod.salePrice)}</p>
                      {prod.basePrice !== prod.salePrice && (
                        <p className="font-lp-mono text-[10px] text-lp-muted-fg line-through">{inr(prod.basePrice)}</p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        {stock <= 0 ? (
                          <Chip tone="red">Out of stock</Chip>
                        ) : (
                          <span className={`text-sm tabular-nums ${stock < 20 ? 'text-[oklch(55%_0.13_65)]' : ''}`}>{stock}</span>
                        )}
                        {restockCounts[prod.id] > 0 && (
                          <span className="adm-mono animate-pulse text-lp-primary">{restockCounts[prod.id]} requests</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Chip tone={prod.isActive ? 'green' : 'muted'}>{prod.isActive ? 'Live' : 'Disabled'}</Chip>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          aria-label={`Edit ${prod.name}`}
                          className="flex size-8 items-center justify-center border border-transparent transition-colors hover:border-lp-primary hover:text-lp-primary"
                          onClick={() => onEditProduct(prod)}
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${prod.name}`}
                          className="flex size-8 items-center justify-center border border-transparent transition-colors hover:border-[oklch(58%_0.22_27)] hover:text-[oklch(58%_0.22_27)]"
                          onClick={() => onDeleteProduct(prod.id)}
                          disabled={!!isDeletingProduct}
                        >
                          {isDeletingProduct === prod.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};
