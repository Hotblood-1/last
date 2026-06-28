import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white font-display font-bold">T</div>
              <span className="font-display text-xl font-bold">TestSeries</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Stationery that studies harder with you. Made for Indian students.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/products" className="hover:text-blue-600">All products</Link></li>
              <li><Link to="/products?category=Stationery" className="hover:text-blue-600">Notebooks</Link></li>
              <li><Link to="/products?category=Tablet" className="hover:text-blue-600">LCD Tablets</Link></li>
              <li><Link to="/products?category=Geometry" className="hover:text-blue-600">Geometry</Link></li>
              <li><Link to="/products?category=Bottle" className="hover:text-blue-600">Water bottles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/about" className="hover:text-blue-600">About us</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@testseries.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 90000 00000</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Made in India</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Facebook className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} TestSeries · All rights reserved.
        </div>
      </div>
    </footer>
  );
}
