export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 prose prose-slate" data-testid="privacy-page">
      <h1 className="font-display text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-slate-600">
        We respect your privacy. The information we collect (phone, name, address) is used only to
        process and ship your orders. We never sell your data to third parties.
      </p>
      <h2 className="mt-8 font-display text-xl font-bold text-slate-900">What we collect</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600">
        <li>Account information (name, phone)</li>
        <li>Shipping address and contact details</li>
        <li>Order history</li>
      </ul>
      <h2 className="mt-8 font-display text-xl font-bold text-slate-900">How we use it</h2>
      <p className="mt-2 text-slate-600">
        To deliver your order, send updates, and improve your shopping experience.
      </p>
    </div>
  );
}
