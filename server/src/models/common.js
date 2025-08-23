import mongoose from "mongoose";

export const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  qty: { type: Number, default: 1, min: 0 },
  price: { type: Number, default: 0, min: 0 } // NGN
}, { _id: false });

export function calcTotals(items = [], taxRate = 0){
  const subtotal = items.reduce((s,i)=> s + (Number(i.qty||0)*Number(i.price||0)), 0);
  const tax = subtotal * (Number(taxRate||0) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
