'use client';

import { useState, useEffect } from 'react';
import { getDatabase, ref as dbRef, onValue, set, push, remove, update } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Plus, Edit2, Trash2, Image as ImageIcon, Save, X, Loader2, Upload, Search } from 'lucide-react';

export default function AdminMenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
    available: true,
    popular: false
  });

  // Fetch items
  useEffect(() => {
    const database = getDatabase(app);
    const menuRef = dbRef(database, 'menu_items');
    const unsubscribe = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        itemsList.sort((a, b) => a.category.localeCompare(b.category));
        setItems(itemsList);
      } else {
        setItems([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      image: '',
      available: true,
      popular: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      image: item.image || '',
      available: item.available ?? true,
      popular: item.popular ?? false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        const database = getDatabase(app);
        await remove(dbRef(database, `menu_items/${id}`));
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete item.");
      }
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const database = getDatabase(app);
      await update(dbRef(database, `menu_items/${id}`), { available: !currentStatus });
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const database = getDatabase(app);
      const itemData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        description: formData.description,
        image: formData.image,
        available: formData.available,
        popular: formData.popular,
        updatedAt: Date.now()
      };

      if (editingId) {
        // Safe multipath update
        const updates: any = {};
        updates[`menu_items/${editingId}`] = itemData;
        await update(dbRef(database), updates);
      } else {
        // Safe push with data
        const itemsRef = dbRef(database, 'menu_items');
        await push(itemsRef, {
          ...itemData,
          createdAt: Date.now()
        });
      }
      
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`Failed to save menu item. Error: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-[#F58A1F]" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Menu Management</h1>
          <p className="text-[#B5B5B5]">Add, edit, or remove items from your cafe menu.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#888]" />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[#161616] text-white border border-[#2a2a2a] pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#F58A1F] transition-colors"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} /> Add New Item
          </button>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden flex-grow overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0B0B0B] sticky top-0 z-10">
            <tr className="text-[#B5B5B5] border-b border-[#2a2a2a]">
              <th className="py-4 px-6 font-medium">Item</th>
              <th className="py-4 px-6 font-medium">Category</th>
              <th className="py-4 px-6 font-medium">Price</th>
              <th className="py-4 px-6 font-medium text-center">Status</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-white divide-y divide-[#2a2a2a]">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-[#2a2a2a]" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#0B0B0B] border border-[#2a2a2a] flex items-center justify-center text-[#B5B5B5]">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-[#B5B5B5] truncate max-w-xs">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="bg-[#2a2a2a] px-3 py-1 rounded-full text-sm">
                    {item.category}
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-[#F58A1F]">₹{item.price}</td>
                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => handleToggleAvailability(item.id, item.available)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      item.available ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    }`}
                  >
                    {item.available ? 'Available' : 'Out of Stock'}
                  </button>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="text-[#B5B5B5] hover:text-white transition-colors bg-[#2a2a2a] hover:bg-[#333] p-2 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-[#B5B5B5] hover:text-red-500 transition-colors bg-[#2a2a2a] hover:bg-red-500/10 p-2 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-[#B5B5B5]">
            <p>{items.length === 0 ? 'No menu items found. Click "Add New Item" to create one.' : 'No items match your search.'}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl my-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a]">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Menu Item' : 'Add New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#B5B5B5] hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Image Upload Section */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#2a2a2a] rounded-xl p-6 bg-[#0B0B0B] hover:border-[#F58A1F] transition-colors relative">
                {formData.image ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden flex items-center justify-center bg-black">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="max-h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-black/70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <Upload size={16} /> Change Image
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full py-8">
                    <Upload size={32} className="text-[#B5B5B5] mb-2" />
                    <span className="text-white font-medium">Upload Image from Device</span>
                    <span className="text-[#B5B5B5] text-sm mt-1">Tap to select photo (JPG, PNG)</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Item Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Category *</label>
                  <input 
                    type="text" 
                    required
                    list="categories"
                    placeholder="e.g. Pizza, Snacks..."
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
                  />
                  <datalist id="categories">
                    <option value="Pizza" />
                    <option value="Sandwich" />
                    <option value="Burgers" />
                    <option value="Drink Menu" />
                    <option value="Snacks" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Price (₹) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full sm:w-1/2 bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Description</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 p-4 bg-[#0B0B0B] border border-[#2a2a2a] rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="w-5 h-5 accent-[#F58A1F] rounded bg-[#161616] border-[#2a2a2a]"
                  />
                  <span className="text-white font-medium">Available in Stock</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer border-l border-[#2a2a2a] pl-6">
                  <input 
                    type="checkbox" 
                    checked={formData.popular}
                    onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                    className="w-5 h-5 accent-[#F58A1F] rounded bg-[#161616] border-[#2a2a2a]"
                  />
                  <span className="text-white font-medium">Mark as Popular</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[#2a2a2a]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-[#B5B5B5] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F58A1F] hover:bg-[#e07a1b] disabled:bg-[#444] disabled:text-[#888] text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
