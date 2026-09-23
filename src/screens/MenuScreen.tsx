import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuItem } from '../types';
import { 
  Plus, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  UtensilsCrossed, 
  Clock, 
  Check, 
  FolderPlus 
} from 'lucide-react';

interface MenuScreenProps {
  onOpenAddItem: (itemToEdit?: MenuItem) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onOpenAddItem }) => {
  const { menuItems, menuCategories, toggleItemAvailability, deleteMenuItem, addCategory } = useOwnerApp();
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const filteredItems = menuItems.filter((item) => {
    if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
  });

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      await addCategory(newCatName.trim());
      setNewCatName('');
      setShowAddCatModal(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 p-4 max-w-4xl mx-auto">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Menu & Kitchen Inventory</h2>
          <p className="text-xs text-slate-400">
            {menuItems.length} dishes across {menuCategories.length} categories
          </p>
        </div>

        <button
          onClick={() => onOpenAddItem()}
          className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dish / Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dishes by name or ingredients..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            selectedCatId === 'all'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All ({menuItems.length})
        </button>

        {menuCategories.map((cat) => {
          const isSelected = selectedCatId === cat.id;
          const count = menuItems.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}

        <button
          onClick={() => setShowAddCatModal(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 flex items-center gap-1 whitespace-nowrap transition"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Category</span>
        </button>
      </div>

      {/* Menu Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">No dishes found</h4>
          <p className="text-xs text-slate-500 mt-1">Tap &apos;Add Dish / Item&apos; to create a new entry</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                item.isAvailable ? 'border-slate-800' : 'border-slate-800 opacity-60 bg-slate-950/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                        item.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-white">{item.name}</h4>
                  </div>

                  {item.tag && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {item.tag}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="font-black text-sm text-orange-400">₹{item.price}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.preparationTimeMinutes}m prep
                  </span>
                </div>
              </div>

              {/* Bottom Availability Toggle & Actions */}
              <div className="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isAvailable}
                    onChange={(e) => toggleItemAvailability(item.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative" />
                  <span
                    className={`text-[11px] font-bold ${
                      item.isAvailable ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </span>
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenAddItem(item)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Edit Dish"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${item.name}" from your menu?`)) {
                        deleteMenuItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                    title="Delete Dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCategorySubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Menu Category</h3>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category Title</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Tandoori Platters, Beverages"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-950"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
