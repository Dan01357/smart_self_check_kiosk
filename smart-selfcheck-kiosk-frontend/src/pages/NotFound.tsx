// pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Page not found</p>

      <Link
        to="/"
        className="mt-4 text-blue-500 underline"
      >
        Go back home
      </Link>
    </div>
  );
}
