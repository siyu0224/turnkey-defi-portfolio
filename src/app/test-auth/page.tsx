import TurnkeyAuthTest from '@/components/TurnkeyAuthTest';
import TurnkeyAuthDirect from '@/components/TurnkeyAuthDirect';

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TurnkeyAuthTest />
          <TurnkeyAuthDirect />
        </div>
      </div>
    </div>
  );
}