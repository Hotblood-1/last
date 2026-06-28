export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" data-testid="terms-page">
      <h1 className="font-display text-3xl font-bold text-slate-900">Terms &amp; Conditions</h1>
      <p className="mt-4 text-slate-600">
        By using TestSeries, you agree to the following terms. We may update these terms from
        time to time — continued use means you accept the changes.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold text-slate-900">Orders</h2>
      <p className="mt-2 text-slate-600">
        All orders are subject to availability. Prices are in INR and inclusive of applicable taxes.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold text-slate-900">Shipping</h2>
      <p className="mt-2 text-slate-600">
        Free shipping on orders over ₹499. Standard delivery 3–7 business days across India.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold text-slate-900">Returns</h2>
      <p className="mt-2 text-slate-600">
        Defective or damaged products can be returned within 7 days of delivery for replacement.
      </p>
    </div>
  );
}
