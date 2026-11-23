// Nạp Three.js từ gói npm nội bộ để game không phụ thuộc CDN/Internet.
import * as THREE from 'three';
window.THREE = THREE;
await import('./main.js');
