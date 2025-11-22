import { Home, Receipt, Calendar, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Receipt, label: 'Chi tiêu', path: '/expenses' },
    { icon: Calendar, label: 'Lịch', path: '/calendar' },
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 
      bg-white border-t border-gray-200 
      pb-safe
      md:hidden
      z-50
    ">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center gap-1
                tap-target
                transition-colors
                ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-gray-500 active:text-gray-700'
                }
              `}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
