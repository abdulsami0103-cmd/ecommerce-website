'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

const categories = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    productCount: 150,
    subcategories: [
      { id: '1-1', name: 'Smartphones', slug: 'smartphones', productCount: 45 },
      { id: '1-2', name: 'Laptops', slug: 'laptops', productCount: 32 },
      { id: '1-3', name: 'Accessories', slug: 'accessories', productCount: 73 },
    ],
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    productCount: 320,
    subcategories: [
      { id: '2-1', name: "Men's Clothing", slug: 'mens-clothing', productCount: 120 },
      { id: '2-2', name: "Women's Clothing", slug: 'womens-clothing', productCount: 150 },
      { id: '2-3', name: 'Shoes', slug: 'shoes', productCount: 50 },
    ],
  },
  {
    id: '3',
    name: 'Home & Living',
    slug: 'home-living',
    productCount: 180,
    subcategories: [
      { id: '3-1', name: 'Furniture', slug: 'furniture', productCount: 80 },
      { id: '3-2', name: 'Decor', slug: 'decor', productCount: 100 },
    ],
  },
  {
    id: '4',
    name: 'Sports',
    slug: 'sports',
    productCount: 95,
    subcategories: [],
  },
  {
    id: '5',
    name: 'Beauty',
    slug: 'beauty',
    productCount: 210,
    subcategories: [],
  },
];

export default function AdminCategoriesPage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', parent: '' });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categories.map((category) => (
                  <div key={category.id}>
                    <div
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <ChevronRight
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            expandedCategories.includes(category.id) ? 'rotate-90' : ''
                          } ${category.subcategories.length === 0 ? 'invisible' : ''}`}
                        />
                        <FolderTree className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-500">{category.productCount} products</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.includes(category.id) &&
                      category.subcategories.length > 0 && (
                        <div className="bg-gray-50 border-t">
                          {category.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between px-6 py-3 pl-16 hover:bg-gray-100"
                            >
                              <div>
                                <p className="text-gray-900">{sub.name}</p>
                                <p className="text-sm text-gray-500">{sub.productCount} products</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Category Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Category Name"
                placeholder="Enter category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={newCategory.parent}
                  onChange={(e) => setNewCategory({ ...newCategory, parent: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Drag and drop an image or click to upload
                  </p>
                </div>
              </div>

              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Category Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Categories</span>
                  <span className="font-medium">{categories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subcategories</span>
                  <span className="font-medium">
                    {categories.reduce((sum, c) => sum + c.subcategories.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-medium">
                    {categories.reduce((sum, c) => sum + c.productCount, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
