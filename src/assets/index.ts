// 玩家图像
export const PLAYER_IMAGE = 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="50" height="50" version="1.1" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
 <rect width="50" height="50" fill="#4CAF50" rx="5"/>
 <circle cx="25" cy="20" r="10" fill="#81C784"/>
 <rect x="15" y="30" width="20" height="20" fill="#81C784"/>
</svg>`);

// 僵尸图像
export const ZOMBIE_IMAGE = 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="40" height="40" version="1.1" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
 <circle cx="20" cy="20" r="18" fill="#795548"/>
 <circle cx="15" cy="15" r="3" fill="#000"/>
 <circle cx="25" cy="15" r="3" fill="#000"/>
 <path d="M15 25 Q20 30 25 25" stroke="#000" fill="none" stroke-width="2"/>
</svg>`);

// 子弹图像
export const BULLET_IMAGE = 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="10" height="20" version="1.1" viewBox="0 0 10 20" xmlns="http://www.w3.org/2000/svg">
 <rect width="10" height="20" fill="#FFC107" rx="5"/>
</svg>`);

// 背景图像
export const BACKGROUND_IMAGE = 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" version="1.1" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
 <rect width="800" height="600" fill="#263238"/>
 <g fill="#37474F">
  <rect x="0" y="0" width="800" height="100"/>
  <rect x="0" y="500" width="800" height="100"/>
 </g>
</svg>`); 