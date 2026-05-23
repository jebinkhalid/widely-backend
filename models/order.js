const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  item: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, 
  address: { type: String },         // ✅ Ensure this is here
  paymentMethod: { type: String },   // ✅ Ensure this is here
  status: { type: String, default: "Placed" },
  createdAt: { type: Date, default: Date.now },
});