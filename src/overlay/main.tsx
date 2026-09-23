import { createRoot } from 'react-dom/client';
import { FishLayer } from './FishLayer';
import '@/styles/global.css';

// 不用 StrictMode：双挂载会让 rAF 主循环与 IPC 订阅被重复初始化
createRoot(document.getElementById('root')!).render(<FishLayer />);
