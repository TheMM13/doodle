import { AuthProvider, useAuth } from "./auth/AuthContext";
import { SocketProvider, useSocket } from "./socket/SocketContext";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { RoomScreen } from "./screens/RoomScreen";

function Gate() {
  const { room } = useSocket();
  return room ? <RoomScreen /> : <HomeScreen />;
}

function Root() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return (
    <SocketProvider>
      <Gate />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
