import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-2xl">
        <div className="text-6xl mb-6">🥖</div>
        <h1 className="text-5xl font-bold text-amber-800 mb-4">
          Fresh Baked Goods Every Day
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Handcrafted sourdough, flaky pastries, and custom cakes — made with love.
        </p>
        <Link to="/products">
          <Button className="bg-amber-700 hover:bg-amber-800 text-lg px-8 py-6">
            Browse Menu
          </Button>
        </Link>
      </div>
    </div>
  );
}