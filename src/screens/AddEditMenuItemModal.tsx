import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuItem } from '../types';
import { X, Check } from 'lucide-react';

interface AddEditMenuItemModalProps {
  itemToEdit?: MenuItem | null;
  onClose: () => void;
}

export const AddEditMenuItemModal: React.FC<AddEditMenuItemModalProps> = ({
  itemToEdit,
  onClose,
}) => {
  const { menuCategories, saveMenuItem } = useOwnerApp();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [prepTime, setPrepTime] = useState('15');
  const [tag, setTag] = useState<string>('None');

  const tags = ['None', 'Bestseller', "Chef's Special", 'Must Try', 'Spicy', 'New'];

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategoryId(itemToEdit.categoryId || '');
      setPrice(String(itemToEdit.price));
      setDescription(itemToEdit.description || '');
      setIsVeg(itemToEdit.isVeg);
      setIsAvailable(itemToEdit.isAvailable);
      setPrepTime(String(itemToEdit.preparationTimeMinutes));
      setTag(itemToEdit.tag || 'None');
    } else {
      if (menuCategories.length > 0) {
        setCategoryId(menuCategories[0].id);
      }
    }
  }, [itemToEdit, menuCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveMenuItem({
      id: itemToEdit?.id,
      name: name.trim(),
      categoryId: categoryId || undefined,
      price: parseFloat(price) || 0,
      description: description.trim(),
      isVeg,
      isAvailable,
      preparationTimeMinutes: parseInt(prepTime, 10) || 15,
      tag: tag !== 'None' ? tag : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-black text-white">
            {itemToEdit ? 'Edit Dish Details' : 'Add New Dish to Menu'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paneer Tikka Masala"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Menu Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
            >
              {menuCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prep Time (Mins)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Ingredients</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh cottage cheese cooked in creamy tomato gravy with aromatic fenugreek"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          {/* Veg / Non-Veg Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dietary Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isVeg
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>🟢</span>
                <span>Pure Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  !isVeg
                    ? 'bg-red-500/15 border-red-500 text-red-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>🔴</span>
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          {/* Special Badge */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Feature Badge</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    tag === t
                      ? 'bg-orange-600 text-white border-orange-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-200">In Stock for Ordering</p>
              <p className="text-[11px] text-slate-400">Available to customers on menu</p>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-950"
            >
              {itemToEdit ? 'Update Dish' : 'Save Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
